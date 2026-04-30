// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

interface IERC20 {
    function transferFrom(address sender, address recipient, uint256 amount) external returns (bool);
    function transfer(address recipient, uint256 amount) external returns (bool);
    function balanceOf(address account) external view returns (uint256);
    function decimals() external view returns (uint8);
}

/**
 * @title PulseScore
 * @notice Agent reputation & service registry for Kite's agentic economy
 * @dev Supports x402-style payments, service discovery, bidirectional reputation, and ERC-4337 AA wallets
 */
contract PulseScore {
    // ──────────────────────────────────────────────
    //  Types
    // ──────────────────────────────────────────────

    struct Agent {
        address owner;
        uint256 score;
        uint256 totalTxns;
        uint256 successTxns;
        uint256 totalSpent;
        uint256 registeredAt;
        uint256 lastUpdated;
        bool exists;
        uint256 sessionBudget;   // Max USDC per session
        uint256 sessionSpent;    // USDC spent this session
    }

    struct Service {
        address provider;
        string name;
        string description;
        string endpoint;         // API endpoint for x402
        uint256 price;           // USDC per call (18 decimals on Kite)
        uint256 minScore;        // Minimum reputation to access
        bool exists;
        uint256 totalCalls;
        uint256 successfulCalls;
        uint256 totalRevenue;
    }

    struct Transaction {
        address buyer;
        address provider;
        uint256 serviceId;
        uint256 amount;
        bool success;
        uint256 timestamp;
        int256 scoreChange;
        bool x402Authorized;     // True if settled via x402
    }

    struct Rating {
        address rater;
        uint8 score;             // 1-5
        string feedback;
        uint256 timestamp;
    }

    // ──────────────────────────────────────────────
    //  State
    // ──────────────────────────────────────────────

    mapping(address => Agent) public agents;
    mapping(uint256 => Service) public services;
    mapping(uint256 => Transaction[]) public serviceTransactions;
    mapping(uint256 => Rating[]) public serviceRatings;
    mapping(address => uint256[]) public agentServices;     // Services offered by agent
    mapping(address => Transaction[]) public agentTransactions;
    mapping(address => mapping(address => bool)) public delegates; // agent => delegate => allowed

    address[] public agentList;
    uint256 public serviceCount;

    IERC20 public usdcToken;
    address public owner;

    // Score parameters
    uint256 public constant MAX_SCORE = 1000;
    uint256 public constant MIN_SCORE = 0;
    uint256 public constant SUCCESS_BONUS = 5;
    uint256 public constant FAILURE_PENALTY = 15;
    uint256 public constant MIN_TXN_INTERVAL = 10 seconds;
    uint256 public constant DECAY_RATE = 1;
    uint256 public constant DEFAULT_BUDGET = 100 * 1e18; // $100 USDC default session budget

    // ──────────────────────────────────────────────
    //  Events
    // ──────────────────────────────────────────────

    event AgentRegistered(address indexed agent, address indexed owner, uint256 budget);
    event ServiceRegistered(uint256 indexed serviceId, address indexed provider, string name, uint256 price);
    event ServiceRequested(uint256 indexed serviceId, address indexed buyer, uint256 amount);
    event PaymentSettled(uint256 indexed serviceId, address indexed buyer, address indexed provider, uint256 amount, bool success, uint256 newBuyerScore);
    event ServiceRated(uint256 indexed serviceId, address indexed rater, uint8 score);
    event SessionRefreshed(address indexed agent, uint256 newBudget);
    event ScoreUpdated(address indexed agent, uint256 oldScore, uint256 newScore);
    event DelegateAdded(address indexed agent, address indexed delegate);
    event DelegateRemoved(address indexed agent, address indexed delegate);
    event OwnershipTransferred(address indexed agent, address indexed newOwner);

    // ──────────────────────────────────────────────
    //  Modifiers
    // ──────────────────────────────────────────────

    modifier onlyOwner() {
        require(msg.sender == owner, "PulseScore: not owner");
        _;
    }

    modifier agentExists(address _agent) {
        require(agents[_agent].exists, "PulseScore: agent not registered");
        _;
    }

    modifier serviceExists(uint256 _serviceId) {
        require(services[_serviceId].exists, "PulseScore: service not found");
        _;
    }

    // ──────────────────────────────────────────────
    //  Constructor
    // ──────────────────────────────────────────────

    constructor(address _usdcToken) {
        owner = msg.sender;
        usdcToken = IERC20(_usdcToken);
    }

    // ──────────────────────────────────────────────
    //  Agent Lifecycle
    // ──────────────────────────────────────────────

    /**
     * @notice Register a new agent, or update owner if already registered (idempotent for AA wallet takeover)
     */
    function registerAgent(address _agentAddress) external {
        if (agents[_agentAddress].exists) {
            // Idempotent: allow AA wallet or new owner to take over ownership
            agents[_agentAddress].owner = msg.sender;
            emit OwnershipTransferred(_agentAddress, msg.sender);
            return;
        }

        agents[_agentAddress] = Agent({
            owner: msg.sender,
            score: 200,
            totalTxns: 0,
            successTxns: 0,
            totalSpent: 0,
            registeredAt: block.timestamp,
            lastUpdated: 0,
            exists: true,
            sessionBudget: DEFAULT_BUDGET,
            sessionSpent: 0
        });

        agentList.push(_agentAddress);
        emit AgentRegistered(_agentAddress, msg.sender, DEFAULT_BUDGET);
    }

    function refreshSession() external agentExists(msg.sender) {
        Agent storage agent = agents[msg.sender];
        agent.sessionBudget = DEFAULT_BUDGET;
        agent.sessionSpent = 0;
        emit SessionRefreshed(msg.sender, DEFAULT_BUDGET);
    }

    // ──────────────────────────────────────────────
    //  Delegation (ERC-4337 AA Wallet Support)
    // ──────────────────────────────────────────────

    function addDelegate(address delegate) external agentExists(msg.sender) {
        delegates[msg.sender][delegate] = true;
        emit DelegateAdded(msg.sender, delegate);
    }

    function removeDelegate(address delegate) external agentExists(msg.sender) {
        delegates[msg.sender][delegate] = false;
        emit DelegateRemoved(msg.sender, delegate);
    }

    function isAuthorized(address buyer, address caller) internal view returns (bool) {
        Agent storage a = agents[buyer];
        return caller == a.owner || delegates[buyer][caller];
    }

    // ──────────────────────────────────────────────
    //  Service Registry
    // ──────────────────────────────────────────────

    function registerService(
        string calldata _name,
        string calldata _description,
        string calldata _endpoint,
        uint256 _price,
        uint256 _minScore
    ) external agentExists(msg.sender) {
        serviceCount++;
        services[serviceCount] = Service({
            provider: msg.sender,
            name: _name,
            description: _description,
            endpoint: _endpoint,
            price: _price,
            minScore: _minScore,
            exists: true,
            totalCalls: 0,
            successfulCalls: 0,
            totalRevenue: 0
        });
        agentServices[msg.sender].push(serviceCount);
        emit ServiceRegistered(serviceCount, msg.sender, _name, _price);
    }

    // ──────────────────────────────────────────────
    //  x402-Style Payment Flow
    // ──────────────────────────────────────────────

    /**
     * @notice Step 1: Agent requests a service (x402 "402 challenge")
     * @param _serviceId The service to request
     * @param _buyer The agent requesting (allows ERC-4337 AA wallets via delegation)
     */
    function requestService(uint256 _serviceId, address _buyer) external serviceExists(_serviceId) agentExists(_buyer) {
        Service storage svc = services[_serviceId];
        Agent storage buyer = agents[_buyer];

        require(isAuthorized(_buyer, msg.sender), "PulseScore: not authorized");
        require(_buyer != svc.provider, "PulseScore: cannot request own service");
        require(buyer.score >= svc.minScore, "PulseScore: insufficient reputation");
        require(buyer.sessionBudget - buyer.sessionSpent >= svc.price, "PulseScore: session budget exceeded");

        emit ServiceRequested(_serviceId, _buyer, svc.price);
    }

    /**
     * @notice Step 2: Settle payment after service delivery (x402 settlement)
     * @param _serviceId The service consumed
     * @param _buyer The agent who consumed the service
     * @param _success Whether the service delivery succeeded
     */
    function settlePayment(
        uint256 _serviceId,
        address _buyer,
        bool _success
    ) external serviceExists(_serviceId) agentExists(_buyer) {
        Service storage svc = services[_serviceId];
        Agent storage buyer = agents[_buyer];

        require(msg.sender == svc.provider || isAuthorized(_buyer, msg.sender), "PulseScore: not authorized");
        require(_buyer != svc.provider, "PulseScore: self-service");
        require(buyer.score >= svc.minScore, "PulseScore: insufficient reputation");
        require(buyer.sessionBudget - buyer.sessionSpent >= svc.price, "PulseScore: session budget exceeded");

        // Anti-spam
        if (buyer.totalTxns > 0) {
            require(block.timestamp - buyer.lastUpdated >= MIN_TXN_INTERVAL, "PulseScore: too frequent");
        }

        // Transfer USDC from buyer to provider
        if (svc.price > 0) {
            require(
                usdcToken.transferFrom(buyer.owner, svc.provider, svc.price),
                "PulseScore: USDC transfer failed"
            );
        }

        // Update buyer session budget
        buyer.sessionSpent += svc.price;

        // Calculate score change for buyer
        int256 scoreChange;
        if (_success) {
            uint256 valueBonus = svc.price > 1_000_000_000_000_000_000 ? 3 : svc.price > 100_000_000_000_000_000 ? 2 : 1;
            scoreChange = int256(SUCCESS_BONUS + valueBonus);
        } else {
            scoreChange = -int256(FAILURE_PENALTY);
        }

        // Time decay
        if (buyer.lastUpdated > 0) {
            uint256 weeksInactive = (block.timestamp - buyer.lastUpdated) / 1 weeks;
            if (weeksInactive > 0) {
                scoreChange += -int256(weeksInactive * DECAY_RATE);
            }
        }

        // Update buyer score
        uint256 oldScore = buyer.score;
        int256 newScore = int256(buyer.score) + scoreChange;
        if (newScore > int256(MAX_SCORE)) newScore = int256(MAX_SCORE);
        if (newScore < int256(MIN_SCORE)) newScore = int256(MIN_SCORE);
        buyer.score = uint256(newScore);

        // Update buyer stats
        buyer.totalTxns++;
        if (_success) buyer.successTxns++;
        buyer.totalSpent += svc.price;
        buyer.lastUpdated = block.timestamp;

        // Update service stats
        svc.totalCalls++;
        if (_success) svc.successfulCalls++;
        svc.totalRevenue += svc.price;

        // Record transaction
        Transaction memory txn = Transaction({
            buyer: _buyer,
            provider: svc.provider,
            serviceId: _serviceId,
            amount: svc.price,
            success: _success,
            timestamp: block.timestamp,
            scoreChange: scoreChange,
            x402Authorized: true
        });
        serviceTransactions[_serviceId].push(txn);
        agentTransactions[_buyer].push(txn);

        emit PaymentSettled(_serviceId, _buyer, svc.provider, svc.price, _success, buyer.score);
        emit ScoreUpdated(_buyer, oldScore, buyer.score);
    }

    // ──────────────────────────────────────────────
    //  Service Ratings (Provider Reputation)
    // ──────────────────────────────────────────────

    function rateService(uint256 _serviceId, uint8 _score, string calldata _feedback) external agentExists(msg.sender) serviceExists(_serviceId) {
        require(_score >= 1 && _score <= 5, "PulseScore: score 1-5");
        serviceRatings[_serviceId].push(Rating({
            rater: msg.sender,
            score: _score,
            feedback: _feedback,
            timestamp: block.timestamp
        }));
        emit ServiceRated(_serviceId, msg.sender, _score);
    }

    // ──────────────────────────────────────────────
    //  View Functions
    // ──────────────────────────────────────────────

    function getAgent(address _agent) external view returns (Agent memory) {
        require(agents[_agent].exists, "PulseScore: not registered");
        return agents[_agent];
    }

    function getService(uint256 _serviceId) external view returns (Service memory) {
        require(services[_serviceId].exists, "PulseScore: service not found");
        return services[_serviceId];
    }

    function getAgentServices(address _agent) external view returns (uint256[] memory) {
        return agentServices[_agent];
    }

    function getServiceTransactions(uint256 _serviceId, uint256 _count) external view returns (Transaction[] memory) {
        Transaction[] storage txns = serviceTransactions[_serviceId];
        uint256 len = txns.length;
        uint256 count = _count > len ? len : _count;
        Transaction[] memory result = new Transaction[](count);
        for (uint256 i = 0; i < count; i++) {
            result[i] = txns[len - 1 - i];
        }
        return result;
    }

    function getAgentTransactions(address _agent, uint256 _count) external view returns (Transaction[] memory) {
        Transaction[] storage txns = agentTransactions[_agent];
        uint256 len = txns.length;
        uint256 count = _count > len ? len : _count;
        Transaction[] memory result = new Transaction[](count);
        for (uint256 i = 0; i < count; i++) {
            result[i] = txns[len - 1 - i];
        }
        return result;
    }

    function getServiceRatings(uint256 _serviceId) external view returns (Rating[] memory) {
        return serviceRatings[_serviceId];
    }

    function getServiceAverageRating(uint256 _serviceId) external view returns (uint256) {
        Rating[] storage ratings = serviceRatings[_serviceId];
        if (ratings.length == 0) return 0;
        uint256 sum;
        for (uint256 i = 0; i < ratings.length; i++) {
            sum += ratings[i].score;
        }
        return (sum * 100) / ratings.length; // Basis points (e.g., 450 = 4.5/5)
    }

    function getSuccessRate(address _agent) external view returns (uint256) {
        Agent memory agent = agents[_agent];
        if (agent.totalTxns == 0) return 0;
        return (agent.successTxns * 10000) / agent.totalTxns;
    }

    function getAgentCount() external view returns (uint256) {
        return agentList.length;
    }

    function getServiceCount() external view returns (uint256) {
        return serviceCount;
    }

    function meetsThreshold(address _agent, uint256 _minScore) external view returns (bool) {
        return agents[_agent].exists && agents[_agent].score >= _minScore;
    }

    function getSessionRemaining(address _agent) external view returns (uint256) {
        Agent memory agent = agents[_agent];
        if (!agent.exists) return 0;
        if (agent.sessionBudget > agent.sessionSpent) {
            return agent.sessionBudget - agent.sessionSpent;
        }
        return 0;
    }
}
