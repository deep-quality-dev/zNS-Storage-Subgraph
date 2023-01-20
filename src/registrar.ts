import { Address, BigInt, Bytes, ethereum, log, store } from "@graphprotocol/graph-ts";
import {
  Approval,
  ApprovalForAll,
  ControllerAdded,
  ControllerRemoved,
  DomainCreated,
  DomainCreated1,
  MetadataChanged,
  MetadataLockChanged,
  MetadataLocked,
  MetadataUnlocked,
  Registrar,
  RoyaltiesAmountChanged,
  Transfer,
} from "../generated/Registrar/Registrar";
import {
  Account,
  Controller,
  DomainApproval,
  DomainApprovalForAll,
  DomainRecord,
  DomainTransfer,
  RegistrarContract,
} from "../generated/schema";
import {
  getDefaultRegistrarBlockForNetwork,
  getDefaultRegistrarForNetwork,
} from "./defaultRegistrar";

import {
  controllerId as generateControllerId,
  transferId as generateTransferId,
  approvalId as generateApprovalId,
  approvalForAllId as generateApprovalForAllId,
  toPaddedHexString,
  updateDomainRecord,
  updateDomainRecordBlockStamp,
} from "./utils";

export function handleBlock(block: ethereum.Block): void {
  if (block.number.equals(getDefaultRegistrarBlockForNetwork())) {
    const rootAddress = getDefaultRegistrarForNetwork();
    let registrarContract = RegistrarContract.load(rootAddress.toHex());
    if (registrarContract) {
      log.error("[handleInitialze] already created Registrar", []);
      return;
    }
    registrarContract = new RegistrarContract(rootAddress.toHex());

    // Fill Blockstamp
    registrarContract.blockNumber = block.number.toI32();
    registrarContract.blockHash = block.hash;
    registrarContract.blockTimestamp = block.timestamp;
    registrarContract.txHash = Bytes.fromI32(0);
    registrarContract.txFrom = Address.zero();
    registrarContract.txTo = Address.zero();
    registrarContract.value = BigInt.fromI32(0);

    registrarContract.rootDomain = "0x0";
    registrarContract.save();
    log.info("handler [handleBlock] root Registrar was created", []);
  }
}

export function handleDomainCreatedLegacy(event: DomainCreated): void {
  // log.info("handler [handleDomainCreatedLegacy] called, {}, {}, {}, {}", [
  //   event.params.id.toHex(),
  //   event.params.name,
  //   event.params.parent.toHex(),
  //   event.params.minter.toHex(),
  // ]);

  const domainId = toPaddedHexString(event.params.id);
  let domainRecord = DomainRecord.load(domainId);
  if (!domainRecord) {
    log.error("[handleDomainCreatedLegacy] DomainRecord not exists {}", [domainId]);
    // throw Error(`[handleDomainCreatedLegacy] Legacy domain with domainId: ${domainId} not found.`);
    return;
  }

  const parentId = toPaddedHexString(event.params.parent);
  const domainParent = DomainRecord.load(parentId);
  if (!domainParent) {
    log.error("[handleDomainCreatedLegacy] DomainRecord parent not exists {}, {}", [
      domainId,
      parentId,
    ]);
    // throw Error(`[handleDomainCreatedLegacy] Legacy domain with domainId: ${domainId} not found.`);
    return;
  }

  if (!domainParent.name) {
    domainRecord.name = event.params.name;
  } else {
    // eslint-disable-next-line  @typescript-eslint/no-non-null-assertion
    domainRecord.name = domainParent.name!.concat(".").concat(event.params.name);
  }
  domainRecord.label = event.params.name;

  // Fill Blockstamp
  updateDomainRecordBlockStamp(domainRecord, event);

  // todo, owner
  domainRecord.minter = event.params.minter;
  // domainRecord.metadataLocked = false;
  // domainRecord.metadataLockedBy = Address.zero();
  domainRecord.controller = event.params.controller;
  // domainRecord.royaltyAmount = BigInt.fromI32(0);
  domainRecord.parentId = event.params.parent.toHex();
  domainRecord.subdomainContract = Address.zero().toHex();
  domainRecord.domainGroup = "";
  domainRecord.domainGroupFileIndex = BigInt.fromI32(0);

  domainRecord.save();
}

export function handleDomainCreated(event: DomainCreated1): void {
  // log.info("handler [handleDomainCreated] called, {}, {}, {}", [
  //   event.params.id.toHex(),
  //   event.params.label,
  //   event.params.parent.toHex(),
  // ]);

  const domainId = toPaddedHexString(event.params.id);
  let domainRecord = DomainRecord.load(domainId);
  if (!domainRecord) {
    log.error("[handleDomainCreated] DomainRecord not exists {}", [domainId]);
    // throw Error(`[handleDomainCreated] DomainRecord with domainId: ${domainId} not found.`);
    return;
  }

  const parentId = toPaddedHexString(event.params.parent);
  let domainParent = DomainRecord.load(parentId);
  if (!domainParent) {
    log.error("[handleDomainCreated] DomainRecord parent not exists {}, {}", [domainId, parentId]);
    // throw Error(`[handleDomainCreated] Legacy domain with domainId: ${domainId} not found.`);
    return;
  }

  if (!domainParent.name) {
    domainRecord.name = event.params.label;
  } else {
    // eslint-disable-next-line  @typescript-eslint/no-non-null-assertion
    domainRecord.name = domainParent.name!.concat(".").concat(event.params.label);
  }
  domainRecord.label = event.params.label;

  // Fill Blockstamp
  updateDomainRecordBlockStamp(domainRecord, event);

  domainRecord.minter = event.params.minter;
  // domainRecord.metadataLocked = false;
  // domainRecord.metadataLockedBy = Address.zero();
  domainRecord.controller = event.params.controller;
  domainRecord.royaltyAmount = event.params.royaltyAmount;
  domainRecord.parentId = event.params.parent.toHex();
  domainRecord.subdomainContract = Address.zero().toHex();
  domainRecord.domainGroup = "";
  domainRecord.domainGroupFileIndex = BigInt.fromI32(0);

  domainRecord.save();
}

export function handleMetadataChanged(event: MetadataChanged): void {
  // log.info("handler [handleMetadataChanged] called, {}, {}", [
  //   event.params.id.toHex(),
  //   event.params.uri,
  // ]);

  const domainId = toPaddedHexString(event.params.id);
  let domainRecord = DomainRecord.load(domainId);
  if (domainRecord == null) {
    domainRecord = new DomainRecord(domainId);
  }

  // Fill Blockstamp
  updateDomainRecordBlockStamp(domainRecord, event);

  domainRecord.save();
}

export function handleMetadataLockChanged(event: MetadataLockChanged): void {
  // log.info("handler [handleMetadataLockChanged] called, {}, {}", [
  //   event.params.id.toHex(),
  //   event.params.isLocked ? "true" : "false",
  // ]);

  const domainId = toPaddedHexString(event.params.id);
  let domainRecord = DomainRecord.load(domainId);
  if (domainRecord == null) {
    domainRecord = new DomainRecord(domainId);
  }

  // Fill Blockstamp
  updateDomainRecordBlockStamp(domainRecord, event);

  domainRecord.metadataLocked = event.params.isLocked;
  domainRecord.metadataLockedBy = event.params.locker;
  domainRecord.save();
}

export function handleMetadataLocked(event: MetadataLocked): void {
  // log.info("handler [handleMetadataLocked] called, {}, {}", [event.params.id.toHex(), "true"]);

  const domainId = toPaddedHexString(event.params.id);
  let domainRecord = DomainRecord.load(domainId);
  if (domainRecord == null) {
    domainRecord = new DomainRecord(domainId);
  }

  // Fill Blockstamp
  updateDomainRecordBlockStamp(domainRecord, event);

  domainRecord.metadataLocked = true;
  domainRecord.metadataLockedBy = event.params.locker;
  domainRecord.save();
}

export function handleMetadataUnlocked(event: MetadataUnlocked): void {
  // log.info("handler [handleMetadataUnlocked] called, {}, {}", [event.params.id.toHex(), "false"]);

  const domainId = toPaddedHexString(event.params.id);
  let domainRecord = DomainRecord.load(domainId);
  if (domainRecord == null) {
    domainRecord = new DomainRecord(domainId);
  }

  // Fill Blockstamp
  updateDomainRecordBlockStamp(domainRecord, event);

  domainRecord.metadataLocked = false;
  domainRecord.metadataLockedBy = null;
  domainRecord.save();
}

export function handleRoyaltiesAmountChanged(event: RoyaltiesAmountChanged): void {
  // log.info("handler [handleRoyaltiesAmountChanged] called, {}, {}", [
  //   event.params.id.toHex(),
  //   event.params.amount.toHex(),
  // ]);

  const domainId = toPaddedHexString(event.params.id);
  let domainRecord = DomainRecord.load(domainId);
  if (domainRecord == null) {
    domainRecord = new DomainRecord(domainId);
  }

  // Fill Blockstamp
  updateDomainRecordBlockStamp(domainRecord, event);

  domainRecord.royaltyAmount = event.params.amount;
  domainRecord.save();
}

export function handleControllerAdded(event: ControllerAdded): void {
  const controllerId = generateControllerId(event.address, event.params.controller);
  let controller = Controller.load(controllerId);
  if (controller) {
    log.error("[handleControllerAdded] Controller exists {}", [controllerId]);
    return;
  }
  controller = new Controller(controllerId);

  // Fill Blockstamp
  controller.blockNumber = event.block.number.toI32();
  controller.blockHash = event.block.hash;
  controller.blockTimestamp = event.block.timestamp;
  controller.txHash = event.transaction.hash;
  controller.txFrom = event.transaction.from;
  controller.txTo = event.transaction.to;
  controller.value = event.transaction.value;

  controller.registrar = event.address.toHex();
  controller.controller = event.params.controller;
  controller.exists = true;
  controller.save();
}

export function handleControllerRemoved(event: ControllerRemoved): void {
  const controllerId = generateControllerId(event.address, event.params.controller);
  const controller = Controller.load(controllerId);
  if (!controller) {
    log.error("[handleControllerRemoved] Controller not exists {}", [controllerId]);
    return;
  }

  controller.exists = false;
  controller.save();
}

export function handleDomainTransfer(event: Transfer): void {
  const toAccount = new Account(event.params.to.toHex());
  toAccount.save();
  const fromAccount = new Account(event.params.from.toHex());
  fromAccount.save();

  const domainId = toPaddedHexString(event.params.tokenId);
  if (event.params.to.equals(Address.zero())) {
    store.remove("DomainRecord", domainId);
  } else if (event.params.from.equals(Address.zero())) {
    const domainRecord = new DomainRecord(domainId);
    domainRecord.domainId = event.params.tokenId;
    domainRecord.metadataLocked = false;
    domainRecord.royaltyAmount = BigInt.fromI32(0);
    // Update Blockstamp
    updateDomainRecordBlockStamp(domainRecord, event);
    domainRecord.save();
  }

  const domainTransfer = new DomainTransfer(generateTransferId(event));
  // Fill Blockstamp
  domainTransfer.blockNumber = event.block.number.toI32();
  domainTransfer.blockHash = event.block.hash;
  domainTransfer.blockTimestamp = event.block.timestamp;
  domainTransfer.txHash = event.transaction.hash;
  domainTransfer.txFrom = event.transaction.from;
  domainTransfer.txTo = event.transaction.to;
  domainTransfer.value = event.transaction.value;

  domainTransfer.from = event.params.from.toHex();
  domainTransfer.to = event.params.to.toHex();
  domainTransfer.tokenId = event.params.tokenId;
  domainTransfer.save();
}

export function handleDomainApproval(event: Approval): void {
  const ownerAccount = new Account(event.params.owner.toHex());
  ownerAccount.save();
  const approvedAccount = new Account(event.params.approved.toHex());
  approvedAccount.save();

  const domainApproval = new DomainApproval(generateApprovalId(event));
  // Fill Blockstamp
  domainApproval.blockNumber = event.block.number.toI32();
  domainApproval.blockHash = event.block.hash;
  domainApproval.blockTimestamp = event.block.timestamp;
  domainApproval.txHash = event.transaction.hash;
  domainApproval.txFrom = event.transaction.from;
  domainApproval.txTo = event.transaction.to;
  domainApproval.value = event.transaction.value;

  domainApproval.owner = event.params.owner.toHex();
  domainApproval.approved = event.params.approved.toHex();
  domainApproval.tokenId = event.params.tokenId;
  domainApproval.save();
}

export function handleDomainApprovalForAll(event: ApprovalForAll): void {
  const ownerAccount = new Account(event.params.owner.toHex());
  ownerAccount.save();
  const operatorAccount = new Account(event.params.operator.toHex());
  operatorAccount.save();

  const domainApprovalForAll = new DomainApprovalForAll(generateApprovalForAllId(event));
  // Fill Blockstamp
  domainApprovalForAll.blockNumber = event.block.number.toI32();
  domainApprovalForAll.blockHash = event.block.hash;
  domainApprovalForAll.blockTimestamp = event.block.timestamp;
  domainApprovalForAll.txHash = event.transaction.hash;
  domainApprovalForAll.txFrom = event.transaction.from;
  domainApprovalForAll.txTo = event.transaction.to;
  domainApprovalForAll.value = event.transaction.value;

  domainApprovalForAll.owner = event.params.owner.toHex();
  domainApprovalForAll.operator = event.params.operator.toHex();
  domainApprovalForAll.approved = event.params.approved;
  domainApprovalForAll.save();
}
