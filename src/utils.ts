import { Address, BigInt, ByteArray, Bytes, ethereum } from "@graphprotocol/graph-ts";

export const ADDRESS_ZERO = Address.zero();

export function byteArrayFromHex(s: string): ByteArray {
  if (s.length % 2 !== 0) {
    throw new TypeError("Hex string must have an even number of characters");
  }
  let out = new Uint8Array(s.length / 2);
  for (let i = 0; i < s.length; i += 2) {
    out[i / 2] = parseInt(s.substring(i, i + 2), 16) as u32;
  }
  return changetype<Bytes>(out);
}

export function toPaddedHexString(i: BigInt): string {
  let hex = i.toHex();
  let padded = hex.substr(0, 2) + hex.substr(2).padStart(64, "0");
  return padded;
}

export function containsAny(target: string, search: string): boolean {
  for (let i = 0; i < search.length; ++i) {
    if (target.includes(search.charAt(i))) {
      return true;
    }
  }

  return false;
}

export function domainGroupId(registrar: Address, groupId: BigInt): string {
  return registrar.toHex().concat("-group-").concat(groupId.toString());
}

export function controllerId(registrar: Address, addr: Address): string {
  return registrar.toHex().concat("-controller-").concat(addr.toHexString());
}

export function transferId(event: ethereum.Event): string {
  return event.block.number.toString().concat("-").concat(event.logIndex.toString());
}

export const approvalId = transferId;
export const approvalForAllId = transferId;
