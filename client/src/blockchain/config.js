import { arbitrum, mainnet, sepolia , scrollSepolia} from 'wagmi/chains'

const projectId = "547e0ccd462ecc58480dc3432393574c";
// 2. Create wagmiConfig
const metadata = {
    name: 'fixedYieldprotocol',
    description: 'EDU APP',
    url: 'https://web3modal.com', // origin must match your domain & subdomain
    icons: ['https://avatars.githubusercontent.com/u/37784886']
}
import { defineChain } from "viem"
import { defaultWagmiConfig } from '@web3modal/wagmi/react';

const EDUChain = defineChain({
    id: 656476,
    name: 'EDU Chain Testnet',
    nativeCurrency: {
      decimals: 18,
      name: 'Open Campus Codex Sepolia by dRPC',
      symbol: 'EDU',
    },
    rpcUrls: {
      default: {
        http: ['https://open-campus-codex-sepolia.drpc.org'],
      },
    },
    blockExplorers: {
      default: { name: 'EDU Chain Testnet explorer', url: 'https://opencampus-codex.blockscout.com' },
    },
  });


const chains = [mainnet, arbitrum, EDUChain, sepolia, scrollSepolia]
export const config = defaultWagmiConfig({
    chains,
    projectId,
    metadata,
})