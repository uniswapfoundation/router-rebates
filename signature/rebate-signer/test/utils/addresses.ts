import { ANVIL_ARTIFACT } from "./constants";

export function getContractAddressByContractName(
  contractName: string
): `0x${string}` {
  return ANVIL_ARTIFACT.transactions.find(
    (transaction: any) =>
      transaction.transactionType === "CREATE" &&
      transaction.contractName === contractName
  )?.contractAddress as `0x${string}`;
}
