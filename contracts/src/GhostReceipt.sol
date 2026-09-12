// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

/**
 * @title GhostReceipt
 * @notice Shared coordination layer and neutral state machine for informal two-party agreements.
 */
contract GhostReceipt {
    enum Status {
        Pending,
        Active,
        RevisionPending,
        CompletionPending,
        Completed,
        Rejected,
        Cancelled
    }

    struct AgreementOnChain {
        bytes32 agreementId;
        address partyA;
        address partyB;
        uint32 currentVersion;
        Status status;
        address pendingRevisionProposer;
    }

    mapping(bytes32 => AgreementOnChain) public agreements;

    event AgreementCreated(bytes32 indexed agreementId, address indexed partyA, address indexed partyB);
    event AgreementAccepted(bytes32 indexed agreementId, address indexed partyB);
    event AgreementRejected(bytes32 indexed agreementId, address indexed partyB);
    event RevisionProposed(bytes32 indexed agreementId, uint32 newVersion, address indexed proposer);
    event RevisionAccepted(bytes32 indexed agreementId, uint32 newVersion, address indexed approver);
    event RevisionRejected(bytes32 indexed agreementId, uint32 version);
    event CompletionRequested(bytes32 indexed agreementId, address indexed requester);
    event CompletionConfirmed(bytes32 indexed agreementId, address indexed confirmer);

    error NotAuthorized();
    error InvalidState();
    error SelfApprovalNotAllowed();

    function createAgreement(bytes32 agreementId, address partyB) external {
        if (agreements[agreementId].partyA != address(0)) revert InvalidState();

        agreements[agreementId] = AgreementOnChain({
            agreementId: agreementId,
            partyA: msg.sender,
            partyB: partyB,
            currentVersion: 1,
            status: Status.Pending,
            pendingRevisionProposer: address(0)
        });

        emit AgreementCreated(agreementId, msg.sender, partyB);
    }

    function acceptAgreement(bytes32 agreementId) external {
        AgreementOnChain storage ag = agreements[agreementId];
        if (msg.sender != ag.partyB) revert NotAuthorized();
        if (ag.status != Status.Pending) revert InvalidState();

        ag.status = Status.Active;
        emit AgreementAccepted(agreementId, msg.sender);
    }

    function rejectAgreement(bytes32 agreementId) external {
        AgreementOnChain storage ag = agreements[agreementId];
        if (msg.sender != ag.partyB) revert NotAuthorized();
        if (ag.status != Status.Pending) revert InvalidState();

        ag.status = Status.Rejected;
        emit AgreementRejected(agreementId, msg.sender);
    }

    function proposeRevision(bytes32 agreementId) external {
        AgreementOnChain storage ag = agreements[agreementId];
        if (msg.sender != ag.partyA && msg.sender != ag.partyB) revert NotAuthorized();
        if (ag.status != Status.Active) revert InvalidState();

        ag.status = Status.RevisionPending;
        ag.pendingRevisionProposer = msg.sender;
        emit RevisionProposed(agreementId, ag.currentVersion + 1, msg.sender);
    }

    function acceptRevision(bytes32 agreementId) external {
        AgreementOnChain storage ag = agreements[agreementId];
        if (ag.status != Status.RevisionPending) revert InvalidState();
        if (msg.sender == ag.pendingRevisionProposer) revert SelfApprovalNotAllowed();
        if (msg.sender != ag.partyA && msg.sender != ag.partyB) revert NotAuthorized();

        ag.currentVersion += 1;
        ag.status = Status.Active;
        ag.pendingRevisionProposer = address(0);

        emit RevisionAccepted(agreementId, ag.currentVersion, msg.sender);
    }

    function rejectRevision(bytes32 agreementId) external {
        AgreementOnChain storage ag = agreements[agreementId];
        if (ag.status != Status.RevisionPending) revert InvalidState();
        if (msg.sender == ag.pendingRevisionProposer) revert SelfApprovalNotAllowed();
        if (msg.sender != ag.partyA && msg.sender != ag.partyB) revert NotAuthorized();

        ag.status = Status.Active;
        ag.pendingRevisionProposer = address(0);

        emit RevisionRejected(agreementId, ag.currentVersion + 1);
    }

    function requestCompletion(bytes32 agreementId) external {
        AgreementOnChain storage ag = agreements[agreementId];
        if (msg.sender != ag.partyA && msg.sender != ag.partyB) revert NotAuthorized();
        if (ag.status != Status.Active) revert InvalidState();

        ag.status = Status.CompletionPending;
        emit CompletionRequested(agreementId, msg.sender);
    }

    function confirmCompletion(bytes32 agreementId) external {
        AgreementOnChain storage ag = agreements[agreementId];
        if (msg.sender != ag.partyA && msg.sender != ag.partyB) revert NotAuthorized();
        if (ag.status != Status.CompletionPending) revert InvalidState();

        ag.status = Status.Completed;
        emit CompletionConfirmed(agreementId, msg.sender);
    }
}
