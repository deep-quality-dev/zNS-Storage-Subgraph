import { Address, BigInt } from "@graphprotocol/graph-ts";
export function getDefaultRegistrarForNetwork(): Address {
  return Address.fromString("0xc2e9678A71e50E5AEd036e00e9c5caeb1aC5987D");
}

export function getDefaultRegistrarBlockForNetwork(): BigInt {
  return BigInt.fromI32(12562654);
}
