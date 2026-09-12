const { expect } = require("chai");
const { ethers } = require("hardhat");

describe("GhostReceipt Smart Contract", function () {
  let ghostReceipt;
  let owner, partyA, partyB, stranger;
  const agreementId = ethers.keccak256(ethers.toUtf8Bytes("agreement-123"));

  beforeEach(async function () {
    [owner, partyA, partyB, stranger] = await ethers.getSigners();
    const GhostReceipt = await ethers.getContractFactory("GhostReceipt");
    ghostReceipt = await GhostReceipt.deploy();
  });

  it("should create an agreement in Pending status", async function () {
    await expect(ghostReceipt.connect(partyA).createAgreement(agreementId, partyB.address))
      .to.emit(ghostReceipt, "AgreementCreated")
      .withArgs(agreementId, partyA.address, partyB.address);

    const ag = await ghostReceipt.agreements(agreementId);
    expect(ag.partyA).to.equal(partyA.address);
    expect(ag.partyB).to.equal(partyB.address);
    expect(ag.currentVersion).to.equal(1);
    expect(ag.status).to.equal(0); // Status.Pending
  });

  it("should allow partyB to accept agreement and set Active", async function () {
    await ghostReceipt.connect(partyA).createAgreement(agreementId, partyB.address);
    await expect(ghostReceipt.connect(partyB).acceptAgreement(agreementId))
      .to.emit(ghostReceipt, "AgreementAccepted")
      .withArgs(agreementId, partyB.address);

    const ag = await ghostReceipt.agreements(agreementId);
    expect(ag.status).to.equal(1); // Status.Active
  });

  it("should allow proposing a revision and advancing to RevisionPending", async function () {
    await ghostReceipt.connect(partyA).createAgreement(agreementId, partyB.address);
    await ghostReceipt.connect(partyB).acceptAgreement(agreementId);

    await expect(ghostReceipt.connect(partyA).proposeRevision(agreementId))
      .to.emit(ghostReceipt, "RevisionProposed")
      .withArgs(agreementId, 2, partyA.address);

    const ag = await ghostReceipt.agreements(agreementId);
    expect(ag.status).to.equal(2); // Status.RevisionPending
  });

  it("should revert if proposer tries to accept their own revision (Mutual Approval)", async function () {
    await ghostReceipt.connect(partyA).createAgreement(agreementId, partyB.address);
    await ghostReceipt.connect(partyB).acceptAgreement(agreementId);
    await ghostReceipt.connect(partyA).proposeRevision(agreementId);

    await expect(
      ghostReceipt.connect(partyA).acceptRevision(agreementId)
    ).to.be.revertedWithCustomError(ghostReceipt, "SelfApprovalNotAllowed");
  });

  it("should allow counterpart to accept revision and increment version", async function () {
    await ghostReceipt.connect(partyA).createAgreement(agreementId, partyB.address);
    await ghostReceipt.connect(partyB).acceptAgreement(agreementId);
    await ghostReceipt.connect(partyA).proposeRevision(agreementId);

    await expect(ghostReceipt.connect(partyB).acceptRevision(agreementId))
      .to.emit(ghostReceipt, "RevisionAccepted")
      .withArgs(agreementId, 2, partyB.address);

    const ag = await ghostReceipt.agreements(agreementId);
    expect(ag.status).to.equal(1); // Status.Active
    expect(ag.currentVersion).to.equal(2);
  });

  it("should complete agreement upon mutual confirmation", async function () {
    await ghostReceipt.connect(partyA).createAgreement(agreementId, partyB.address);
    await ghostReceipt.connect(partyB).acceptAgreement(agreementId);
    await ghostReceipt.connect(partyA).requestCompletion(agreementId);

    let ag = await ghostReceipt.agreements(agreementId);
    expect(ag.status).to.equal(3); // Status.CompletionPending

    await ghostReceipt.connect(partyB).confirmCompletion(agreementId);
    ag = await ghostReceipt.agreements(agreementId);
    expect(ag.status).to.equal(4); // Status.Completed
  });
});
