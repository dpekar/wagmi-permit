import { Hex } from 'viem';
import { WalletClient } from 'wagmi';

type PermitSignature = {
    r: Hex;
    s: Hex;
    v: number;
};
type SignPermitProps = {
    /** Address of the token to approve */
    contractAddress: Hex;
    /** Name of the token to approve.
     * Corresponds to the `name` method on the ERC-20 contract. Please note this must match exactly byte-for-byte */
    erc20Name: string;
    /** Owner of the tokens. Usually the currently connected address. */
    ownerAddress: Hex;
    /** Address to grant allowance to */
    spenderAddress: Hex;
    /** Expiration of this approval, in SECONDS */
    deadline: bigint;
    /** Numerical chainId of the token contract */
    chainId: number;
    /** Defaults to 1. Some tokens need a different version, check the [PERMIT INFORMATION](https://github.com/vacekj/wagmi-permit/blob/main/PERMIT.md) for more information */
    permitVersion?: string;
    /** Permit nonce for the specific address and token contract. You can get the nonce from the `nonces` method on the token contract. */
    nonce: bigint;
};
type Eip2612Props = SignPermitProps & {
    /** Amount to approve */
    value: bigint;
};
/**
 * Signs a permit for a given ERC-2612 ERC20 token using the specified parameters.
 *
 * @param {WalletClient} walletClient - Wallet client to invoke for signing the permit message
 * @param {SignPermitProps} props - The properties required to sign the permit.
 * @param {string} props.contractAddress - The address of the ERC20 token contract.
 * @param {string} props.erc20Name - The name of the ERC20 token.
 * @param {number} props.value - The amount of the ERC20 to approve.
 * @param {string} props.ownerAddress - The address of the token holder.
 * @param {string} props.spenderAddress - The address of the token spender.
 * @param {number} props.deadline - The permit expiration timestamp in seconds.
 * @param {number} props.nonce - The nonce of the address on the specified ERC20.
 * @param {number} props.chainId - The chain ID for which the permit will be valid.
 * @param {number} props.permitVersion - The version of the permit (optional, defaults to "1").
 */
declare const signPermit: (walletClient: WalletClient, { contractAddress, erc20Name, ownerAddress, spenderAddress, value, deadline, nonce, chainId, permitVersion, }: Eip2612Props) => Promise<PermitSignature>;
declare const signPermitDai: (walletClient: WalletClient, { contractAddress, erc20Name, ownerAddress, spenderAddress, deadline, nonce, chainId, permitVersion, }: SignPermitProps) => Promise<PermitSignature>;

declare function usePermit({ contractAddress, chainId, walletClient, ownerAddress, spenderAddress, permitVersion, }: UsePermitProps): {
    signPermitDai: ((props: PartialBy<SignPermitProps, 'chainId' | 'ownerAddress' | 'contractAddress' | 'spenderAddress' | 'nonce' | 'erc20Name' | 'permitVersion'> & {
        walletClient?: WalletClient;
    }) => Promise<PermitSignature>) | undefined;
    signPermit: ((props: PartialBy<Eip2612Props, 'chainId' | 'ownerAddress' | 'contractAddress' | 'spenderAddress' | 'nonce' | 'erc20Name' | 'permitVersion'> & {
        walletClient?: WalletClient;
    }) => Promise<PermitSignature>) | undefined;
    signature: PermitSignature | undefined;
    error: Error | undefined;
};
type UsePermitProps = Partial<SignPermitProps> & {
    walletClient?: WalletClient | null;
};
type PartialBy<T, K extends keyof T> = Omit<T, K> & Partial<Pick<T, K>>;

export { type Eip2612Props, type PermitSignature, type SignPermitProps, signPermit, signPermitDai, usePermit };
