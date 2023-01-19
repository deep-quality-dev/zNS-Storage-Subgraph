import { Address, BigInt, Bytes, ethereum, log, Value } from "@graphprotocol/graph-ts";
import { Registrar } from "../generated/Registrar/Registrar";
import { DomainRecord, RegistrarContract, DomainGroup } from "../generated/schema";
import {
  EEDomainCreatedV3,
  EEDomainGroupUpdatedV1,
  EEMetadataLockChanged,
  EENewSubdomainRegistrar,
  EERoyaltiesAmountChanged,
} from "../generated/ZNSHub/ZNSHub";
import { getDefaultRegistrarForNetwork } from "./defaultRegistrar";
import { domainGroupId as generateDomainGroupId, toPaddedHexString } from "./utils";

function updateDomainRecord(
  domainRecord: DomainRecord,
  event: ethereum.Event,
  registrar: Address,
): void {
  // Fill Blockstamp
  domainRecord.blockNumber = event.block.number.toI32();
  domainRecord.blockHash = event.block.hash;
  domainRecord.blockTimestamp = event.block.timestamp;
  domainRecord.txHash = event.transaction.hash;
  domainRecord.txFrom = event.transaction.from;
  domainRecord.txTo = event.transaction.to;
  domainRecord.value = event.transaction.value;

  const registrarInstance = Registrar.bind(registrar);
  const record = registrarInstance.records(domainRecord.domainId);
  domainRecord.minter = record.value0;
  domainRecord.metadataLocked = record.value1;
  domainRecord.metadataLockedBy = record.value2;
  domainRecord.controller = record.value3;
  domainRecord.royaltyAmount = record.value4;
  domainRecord.parentId = record.value5.toHex();
  domainRecord.subdomainContract = record.value6.toHex();
  // domain groups
  const domainGroupId = generateDomainGroupId(registrar, record.value7);
  domainRecord.domainGroup = domainGroupId;
  domainRecord.domainGroupFileIndex = record.value8;
}

export function handleDomainCreatedV3(event: EEDomainCreatedV3): void {
  log.info("handler [handleDomainCreatedV3] called, {}, {}, {}, {}", [
    event.params.registrar.toHex(),
    event.params.id.toHex(),
    event.params.label,
    event.params.parent.toHex(),
  ]);

  const registrarContract = new RegistrarContract(event.params.registrar.toHexString());
  registrarContract.save();

  const domainId = toPaddedHexString(event.params.id);
  let domainRecord = DomainRecord.load(domainId);
  if (domainRecord) {
    log.error("[handleDomainCreatedV3] DomainRecord exists {}", [domainId]);
    return;
  }
  domainRecord = new DomainRecord(domainId);
  domainRecord.domainId = event.params.id;

  const parentId = toPaddedHexString(event.params.parent);
  let domainParent = DomainRecord.load(parentId);
  if (!domainParent) {
    domainParent = new DomainRecord(parentId);
  }
  if (!domainParent.name) {
    domainRecord.name = event.params.label;
  } else {
    // eslint-disable-next-line  @typescript-eslint/no-non-null-assertion
    domainRecord.name = domainParent.name!.concat(".").concat(event.params.label);
  }
  domainRecord.label = event.params.label;

  updateDomainRecord(domainRecord, event, event.params.registrar);
  domainRecord.save();
}

// export function handleMetadataChanged(event: EEMetadataChanged): void {}

export function handleMetadataLockChanged(event: EEMetadataLockChanged): void {
  log.info("handler [handleMetadataLockChanged] called, {}, {}", [
    event.params.registrar.toHex(),
    event.params.id.toHex(),
  ]);

  const domainId = toPaddedHexString(event.params.id);
  const domainRecord = DomainRecord.load(domainId);
  if (domainRecord == null) {
    log.error("[handleMetadataLockChanged] DomainRecord not exists {}", [domainId]);
    return;
  }

  updateDomainRecord(
    domainRecord,
    event,
    domainRecord.subdomainContract
      ? Address.fromString(domainRecord.subdomainContract as string)
      : getDefaultRegistrarForNetwork(),
  );
  domainRecord.save();
}

export function handleNewSubdomainRegistrar(event: EENewSubdomainRegistrar): void {
  log.info("handler [handleNewSubdomainRegistrar] called, {}, {}, {}", [
    event.params.parentRegistrar.toHex(),
    event.params.rootId.toHex(),
    event.params.childRegistrar.toHex(),
  ]);

  const registrarContract = new RegistrarContract(event.params.childRegistrar.toHexString());

  // Fill Blockstamp
  registrarContract.blockNumber = event.block.number.toI32();
  registrarContract.blockHash = event.block.hash;
  registrarContract.blockTimestamp = event.block.timestamp;
  registrarContract.txHash = event.transaction.hash;
  registrarContract.txFrom = event.transaction.from;
  registrarContract.txTo = event.transaction.to;
  registrarContract.value = event.transaction.value;

  registrarContract.rootDomain = toPaddedHexString(event.params.rootId);
  registrarContract.save();
}

export function handleRoyaltiesAmountChanged(event: EERoyaltiesAmountChanged): void {
  log.info("handler [handleRoyaltiesAmountChanged] called, {}, {}", [
    event.params.registrar.toHex(),
    event.params.id.toHex(),
  ]);

  const domainId = toPaddedHexString(event.params.id);
  const domainRecord = DomainRecord.load(domainId);
  if (domainRecord == null) {
    log.error("[handleRoyaltiesAmountChanged] DomainRecord not exists {}", [domainId]);
    return;
  }

  updateDomainRecord(
    domainRecord,
    event,
    domainRecord.subdomainContract
      ? Address.fromString(domainRecord.subdomainContract as string)
      : getDefaultRegistrarForNetwork(),
  );
  domainRecord.save();
}

// export function handleTransferV1(event: EETransferV1): void {}

export function handleDomainGroupUpdatedV1(event: EEDomainGroupUpdatedV1): void {
  log.info("handler [handleDomainGroupUpdatedV1] called, {}, {}, {}", [
    event.params.parentRegistrar.toHex(),
    event.params.folderGroupId.toHex(),
    event.params.baseMetadataUri,
  ]);

  const domainGroupId = generateDomainGroupId(
    event.params.parentRegistrar,
    event.params.folderGroupId,
  );

  let group = DomainGroup.load(domainGroupId);
  if (group) {
    log.error("[handleDomainGroupUpdatedV1] Group exists {}", [domainGroupId]);
    return;
  }

  group = new DomainGroup(domainGroupId);
  // Fill Blockstamp
  group.blockNumber = event.block.number.toI32();
  group.blockHash = event.block.hash;
  group.blockTimestamp = event.block.timestamp;
  group.txHash = event.transaction.hash;
  group.txFrom = event.transaction.from;
  group.txTo = event.transaction.to as Bytes | null;
  group.value = event.transaction.value;

  const registrarInstance = Registrar.bind(event.params.parentRegistrar);
  const result = registrarInstance.domainGroups(event.params.folderGroupId);
  group.groupId = event.params.folderGroupId;
  group.baseMetadataUri = result;

  group.save();
}
