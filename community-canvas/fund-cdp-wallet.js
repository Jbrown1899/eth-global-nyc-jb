const { createWalletClient, http, parseEther } = require('viem');
const { privateKeyToAccount } = require('viem/accounts');
const { anvil } = require('viem/chains');

// Anvil's first pre-funded account private key
const PRIVATE_KEY = '0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80';

// Replace this with your CDP wallet address
const CDP_WALLET_ADDRESS = '0xB29F7E442a805217f9635edF364b16F85B630D67'; // Add your CDP wallet address here

const client = createWalletClient({
  chain: anvil,
  transport: http(),
});

const account = privateKeyToAccount(PRIVATE_KEY);

async function fundCDPWallet() {
  try {
    const hash = await client.sendTransaction({
      account,
      to: CDP_WALLET_ADDRESS,
      value: parseEther('1'), // Send 1 ETH
    });
    
    console.log('Transaction sent:', hash);
    console.log('CDP wallet funded with 1 ETH');
  } catch (error) {
    console.error('Error funding wallet:', error);
  }
}

// Uncomment the line below and add your CDP wallet address to run
fundCDPWallet();
