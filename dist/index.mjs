// src/permit.ts
import { hexToNumber, pad, slice, toHex } from "viem";
var signPermit = async (walletClient, {
  contractAddress,
  erc20Name,
  ownerAddress,
  spenderAddress,
  value,
  deadline,
  nonce,
  chainId,
  permitVersion
}) => {
  const types = {
    Permit: [
      { name: "owner", type: "address" },
      { name: "spender", type: "address" },
      { name: "value", type: "uint256" },
      { name: "nonce", type: "uint256" },
      { name: "deadline", type: "uint256" }
    ]
  };
  const domainData = {
    name: erc20Name,
    /** We assume 1 if permit version is not specified */
    version: permitVersion ?? "1",
    chainId,
    verifyingContract: contractAddress
  };
  const message = {
    owner: ownerAddress,
    spender: spenderAddress,
    value,
    nonce,
    deadline
  };
  const signature = await walletClient.signTypedData({
    account: ownerAddress,
    message,
    domain: domainData,
    primaryType: "Permit",
    types
  });
  const [r, s, v] = [
    slice(signature, 0, 32),
    slice(signature, 32, 64),
    slice(signature, 64, 65)
  ];
  return { r, s, v: hexToNumber(v) };
};
var signPermitDai = (
  /**
   * Signs a permit for a given ERC20 token using the specified parameters.
   *
   * @param {WalletClient} walletClient - 	Wallet client to invoke for signing the permit message
   * @param {SignPermitProps} props - The properties required to sign the permit.
   * @param {string} props.contractAddress - The address of the ERC20 token contract.
   * @param {string} props.erc20Name - The name of the ERC20 token.
   * @param {string} props.ownerAddress - The address of the token holder.
   * @param {string} props.spenderAddress - The address of the token spender.
   * @param {number} props.deadline - The permit expiration timestamp in seconds.
   * @param {number} props.nonce - The nonce of the address on the specified ERC20.
   * @param {number} props.chainId - The chain ID for which the permit will be valid.
   * @param {number} props.permitVersion - The version of the permit (optional, defaults to "1").
   */
  async (walletClient, {
    contractAddress,
    erc20Name,
    ownerAddress,
    spenderAddress,
    deadline,
    nonce,
    chainId,
    permitVersion
  }) => {
    const types = {
      Permit: [
        { name: "holder", type: "address" },
        { name: "spender", type: "address" },
        { name: "nonce", type: "uint256" },
        { name: "expiry", type: "uint256" },
        { name: "allowed", type: "bool" }
      ]
    };
    let domainData = {
      name: erc20Name,
      /** There are no known Dai deployments with Dai permit and version other than or unspecified */
      version: permitVersion ?? "1",
      chainId,
      verifyingContract: contractAddress
    };
    if (chainId === 137 && erc20Name === "USD Coin (PoS)") {
      domainData = {
        name: erc20Name,
        version: permitVersion ?? "1",
        verifyingContract: contractAddress,
        salt: pad(toHex(137), { size: 32 })
      };
    }
    const message = {
      holder: ownerAddress,
      spender: spenderAddress,
      nonce,
      expiry: deadline,
      /** true == infinite allowance, false == 0 allowance*/
      allowed: true
    };
    const signature = await walletClient.signTypedData({
      account: ownerAddress,
      domain: domainData,
      primaryType: "Permit",
      types,
      message
    });
    const [r, s, v] = [
      slice(signature, 0, 32),
      slice(signature, 32, 64),
      slice(signature, 64, 65)
    ];
    return { r, s, v: hexToNumber(v) };
  }
);

// src/hook.ts
import { useContractRead, useWalletClient } from "wagmi";

// src/abi.ts
var ERC20ABI = [
  {
    inputs: [],
    stateMutability: "view",
    type: "function",
    name: "name",
    outputs: [
      {
        internalType: "string",
        name: "",
        type: "string"
      }
    ]
  },
  {
    inputs: [
      {
        internalType: "address",
        name: "owner",
        type: "address"
      }
    ],
    stateMutability: "view",
    type: "function",
    name: "nonces",
    outputs: [
      {
        internalType: "uint256",
        name: "",
        type: "uint256"
      }
    ]
  },
  {
    inputs: [],
    name: "version",
    outputs: [{ internalType: "string", name: "", type: "string" }],
    stateMutability: "view",
    type: "function"
  }
];

// src/hook.ts
import { useState } from "react";
import { zeroAddress } from "viem";
function usePermit({
  contractAddress,
  chainId,
  walletClient,
  ownerAddress,
  spenderAddress,
  permitVersion
}) {
  const [signature, setSignature] = useState();
  const [error, setError] = useState();
  const { data: defaultWalletClient } = useWalletClient();
  const walletClientToUse = walletClient ?? defaultWalletClient;
  const ownerToUse = ownerAddress ?? (walletClientToUse == null ? void 0 : walletClientToUse.account.address) ?? zeroAddress;
  const { data: nonce } = useContractRead({
    chainId,
    address: contractAddress,
    abi: ERC20ABI,
    functionName: "nonces",
    args: [ownerToUse]
  });
  const { data: name } = useContractRead({
    chainId,
    address: contractAddress,
    abi: ERC20ABI,
    functionName: "name"
  });
  const { data: versionFromContract } = useContractRead({
    chainId,
    address: contractAddress,
    abi: ERC20ABI,
    functionName: "version"
  });
  const validatedVersionFromContract = versionFromContract != null && [1, 2, "1", "2"].includes(versionFromContract) ? versionFromContract : null;
  const version = permitVersion ?? validatedVersionFromContract ?? "1";
  const ready = walletClientToUse !== null && walletClientToUse !== void 0 && spenderAddress !== void 0 && chainId !== void 0 && contractAddress !== void 0 && name !== void 0 && nonce !== void 0;
  return {
    signPermitDai: ready ? async (props) => {
      var _a;
      return signPermitDai(props.walletClient ?? walletClientToUse, {
        chainId,
        ownerAddress: ownerAddress ?? ((_a = props.walletClient) == null ? void 0 : _a.account.address) ?? walletClientToUse.account.address,
        contractAddress,
        spenderAddress: spenderAddress ?? zeroAddress,
        erc20Name: name,
        permitVersion: version,
        nonce,
        ...props
      }).then((signature2) => {
        setSignature(signature2);
        return signature2;
      }).catch((error2) => {
        setError(error2);
        throw error2;
      });
    } : void 0,
    signPermit: ready ? async (props) => {
      var _a;
      try {
        const signature2 = await signPermit(
          props.walletClient ?? walletClientToUse,
          {
            chainId,
            ownerAddress: ownerAddress ?? ((_a = props.walletClient) == null ? void 0 : _a.account.address) ?? walletClientToUse.account.address,
            contractAddress,
            spenderAddress: spenderAddress ?? zeroAddress,
            erc20Name: name,
            nonce,
            permitVersion: version,
            ...props
          }
        );
        setSignature(signature2);
        return signature2;
      } catch (error2) {
        setError(error2);
        throw error2;
      }
    } : void 0,
    signature,
    error
  };
}
export {
  signPermit,
  signPermitDai,
  usePermit
};
//# sourceMappingURL=index.mjs.map