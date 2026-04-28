// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

/**
 * @title PulseScore
 * @notice On-chain reputation system for AI agents on Kite Chain
 * @dev Implements time-weighted scoring with anti-gaming protections
 */
contract PulseScore {
    // ──────────────────────────────────────────────
    //  State
    // ──────────────────────────────────────────────

    struct Agent {
        address owner;           // Passport-verified owner
        uint256 score;           // Current pulse score (0-1000)
        uint256 totalTxns;       // Total transactions recorded
        uint256 successTxns;     // Successful transactions
        uint256 totalSpent;      // Total USDC spent (6 decimals)
        uint256 registeredAt;    // Block timestamp of registration
        uint256 lastUpdated;     // Last score update
        bool exists;             // Whether agent is registered
    }

    struct Transaction {
        address agent;
        address service;
        uint256 amount;          // USDC amount (6 decimals)
        bool success;
        uint256 timestamp;
        int256 scoreChange;
    }

    mapping(address => Agent) public agents;
    mapping(address => Transaction[]) public agentTransactions;
    address[] public agentList;

    // Score parameters
    uint256 public constant MAX_SCORE = 1000;
    uint256 public constant MIN_SCORE = 0;
    uint256 public constant SUCCESS_BONUS = 5;
    uint256 public constant FAILURE_PENALTY = 15;
    uint256 public constant MIN_TXN_INTERVAL = 1 minutes; // Anti-spam
    uint256 public constant DECAY_RATE = 1;               // Points per week of inactivity

    // Access control
    address public owner;
    mapping(address => bool) public verifiers; // Passport verifiers

    // ──────────────────────────────────────────────
    //  Events
    // ──────────────────────────────────────────────

    event AgentRegistered(address indexed agent, address indexed owner, uint256 timestamp);
    event TransactionRecorded(address indexed agent, address indexed service, uint256 amount, bool success, int256 scoreChange, uint256 newScore);
    event ScoreUpdated(address indexed agent, uint256 oldScore, uint256 newScore);
    event VerifierAdded(address indexed verifier);
    event VerifierRemoved(address indexed verifier);

    // ──────────────────────────────────────────────
    //  Modifiers
    // ──────────────────────────────────────────────

    modifier onlyOwner() {
        require(msg.sender == owner, "PulseScore: not owner");
        _;
    }

    modifier onlyVerifier() {
        require(verifiers[msg.sender] || msg.sender == owner, "PulseScore: not verifier");
        _;
    }

    modifier agentExists(address _agent) {
        require(agents[_agent].exists, "PulseScore: agent not registered");
        _;
    }

    // ──────────────────────────────────────────────
    //  Constructor
    // ──────────────────────────────────────────────

    constructor() {
        owner = msg.sender;
    }

    // ──────────────────────────────────────────────
    //  Admin
    // ──────────────────────────────────────────────

    function addVerifier(address _verifier) external onlyOwner {
        verifiers[_verifier] = true;
        emit VerifierAdded(_verifier);
    }

    function removeVerifier(address _verifier) external onlyOwner {
        verifiers[_verifier] = false;
        emit VerifierRemoved(_verifier);
    }

    // ──────────────────────────────────────────────
    //  Agent Registration
    // ──────────────────────────────────────────────

    /**
     * @notice Register a new agent (Passport-verified)
     */
    function registerAgent(address _agentAddress) external {
        require(!agents[_agentAddress].exists, "PulseScore: already registered");

        agents[_agentAddress] = Agent({
            owner: msg.sender,
            score: 200, // Start at Newcomer tier
            totalTxns: 0,
            successTxns: 0,
            totalSpent: 0,
            registeredAt: block.timestamp,
            lastUpdated: block.timestamp,
            exists: true
        });

        agentList.push(_agentAddress);
        emit AgentRegistered(_agentAddress, msg.sender, block.timestamp);
    }

    // ──────────────────────────────────────────────
    //  Transaction Recording
    // ──────────────────────────────────────────────

    /**
     * @notice Record a transaction and update agent's Pulse Score
     * @param _agent Address of the agent
     * @param _service Address of the service provider
     * @param _amount USDC amount (6 decimals)
     * @param _success Whether the transaction succeeded
     */
    function recordTransaction(
        address _agent,
        address _service,
        uint256 _amount,
        bool _success
    ) external onlyVerifier agentExists(_agent) {
        Agent storage agent = agents[_agent];

        // Anti-spam: minimum interval between transactions
        require(
            block.timestamp - agent.lastUpdated >= MIN_TXN_INTERVAL,
            "PulseScore: too frequent"
        );

        // Calculate score change
        int256 scoreChange;
        if (_success) {
            // Bonus scales with transaction value (logarithmic)
            uint256 valueBonus = _amount > 1000000 ? 3 : _amount > 100000 ? 2 : 1; // >$1, >$0.1, else
            scoreChange = int256(SUCCESS_BONUS + valueBonus);
        } else {
            // Penalties are heavier to discourage failures
            scoreChange = -int256(FAILURE_PENALTY);
        }

        // Apply time-weighted decay
        uint256 weeksInactive = (block.timestamp - agent.lastUpdated) / 1 weeks;
        if (weeksInactive > 0) {
            int256 decay = -int256(weeksInactive * DECAY_RATE);
            scoreChange += decay;
        }

        // Update score with bounds
        uint256 oldScore = agent.score;
        int256 newScore = int256(agent.score) + scoreChange;
        if (newScore > int256(MAX_SCORE)) newScore = int256(MAX_SCORE);
        if (newScore < int256(MIN_SCORE)) newScore = int256(MIN_SCORE);
        agent.score = uint256(newScore);

        // Update stats
        agent.totalTxns++;
        if (_success) agent.successTxns++;
        agent.totalSpent += _amount;
        agent.lastUpdated = block.timestamp;

        // Record transaction
        agentTransactions[_agent].push(Transaction({
            agent: _agent,
            service: _service,
            amount: _amount,
            success: _success,
            timestamp: block.timestamp,
            scoreChange: scoreChange
        }));

        emit TransactionRecorded(_agent, _service, _amount, _success, scoreChange, agent.score);
        emit ScoreUpdated(_agent, oldScore, agent.score);
    }

    // ──────────────────────────────────────────────
    //  View Functions
    // ──────────────────────────────────────────────

    function getAgent(address _agent) external view returns (Agent memory) {
        require(agents[_agent].exists, "PulseScore: not registered");
        return agents[_agent];
    }

    function getScore(address _agent) external view returns (uint256) {
        return agents[_agent].score;
    }

    function getSuccessRate(address _agent) external view returns (uint256) {
        Agent memory agent = agents[_agent];
        if (agent.totalTxns == 0) return 0;
        return (agent.successTxns * 10000) / agent.totalTxns; // Basis points
    }

    function getTransactionCount(address _agent) external view returns (uint256) {
        return agentTransactions[_agent].length;
    }

    function getRecentTransactions(address _agent, uint256 _count) external view returns (Transaction[] memory) {
        Transaction[] storage txns = agentTransactions[_agent];
        uint256 len = txns.length;
        uint256 count = _count > len ? len : _count;
        Transaction[] memory result = new Transaction[](count);
        for (uint256 i = 0; i < count; i++) {
            result[i] = txns[len - 1 - i]; // Most recent first
        }
        return result;
    }

    function getAgentCount() external view returns (uint256) {
        return agentList.length;
    }

    /**
     * @notice Check if an agent meets a minimum score threshold
     */
    function meetsThreshold(address _agent, uint256 _minScore) external view returns (bool) {
        return agents[_agent].exists && agents[_agent].score >= _minScore;
    }
}
