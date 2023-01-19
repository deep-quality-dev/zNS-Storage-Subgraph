import { Address, log, store } from "@graphprotocol/graph-ts";
import {
  Approval,
  ApprovalForAll,
  ControllerAdded,
  ControllerRemoved,
  Transfer,
} from "../generated/Registrar/Registrar";
import {
  Account,
  Controller,
  DomainApproval,
  DomainApprovalForAll,
  DomainTransfer,
} from "../generated/schema";

import {
  controllerId as generateControllerId,
  transferId as generateTransferId,
  approvalId as generateApprovalId,
  approvalForAllId as generateApprovalForAllId,
  toPaddedHexString,
} from "./utils";

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
