/* eslint-disable @typescript-eslint/no-unsafe-assignment */
/* eslint-disable @typescript-eslint/no-unsafe-member-access */

import {
  Keypair,
  Connection,
  PublicKey,
  LAMPORTS_PER_SOL,
  TransactionInstruction,
  Transaction,
  sendAndConfirmTransaction,
} from '@solana/web3.js';

import * as BufferLayout from '@solana/buffer-layout';
import { Buffer } from 'buffer';
import * as borsh from 'borsh';

/**
 * Connection to the network
 */
let connection: Connection;

/**
 * Keypair associated to the fees' payer
 */
let payer: Keypair;

/**
 * Hello world's program id
 */
let programId: PublicKey;

/**
 * The public key of the account we are saying hello to
 */
let weekslotPubkey: PublicKey;

/**
 * The state of a WeekSlot account
 */
class WeekSlotAccount {
  slot1 = 0; slot2 = 0; slot3 = 0;
  slot4 = 0; slot5 = 0; slot6 = 0;
  slot7 = 0;
  
  constructor(fields: {
    slot1: number, slot2: number, slot3: number,
    slot4: number, slot5: number, slot6: number, 
    slot7: number} | undefined = undefined) {
      if (fields) {
        this.slot1 = fields.slot1;
        this.slot2 = fields.slot2;
        this.slot3 = fields.slot3;
        this.slot4 = fields.slot4;
        this.slot5 = fields.slot5;
        this.slot6 = fields.slot6;
        this.slot7 = fields.slot7;
      }
  }
}

/**
 * Borsh schema definition for WeekSlot account
 */
const WeekSlotSchema = new Map([
  [ WeekSlotAccount, {kind: 'struct', 
                      fields: [
                        ['slot1', 'u32'],
                        ['slot2', 'u32'],
                        ['slot3', 'u32'],
                        ['slot4', 'u32'],
                        ['slot5', 'u32'],
                        ['slot6', 'u32'],
                        ['slot7', 'u32']
                        ]}],
]);

/**
 * The expected size of each greeting account.
 */
const WEEKSLOT_SIZE = borsh.serialize(
  WeekSlotSchema,
  new WeekSlotAccount(),
).length;

/**
 * Establish a connection to the cluster
 */
export async function establishConnection(): Promise<void> {
  // connecting to dev-net
  const rpcUrl = 'https://api.devnet.solana.com';
  connection = new Connection(rpcUrl, 'confirmed');
  const version = await connection.getVersion();
  console.log('Connection to cluster established:', rpcUrl, version);
}

/**
 * Establish an account to pay for everything
 */
export async function establishPayer(): Promise<void> {
  let fees = 0;
  if (!payer) {
    const {feeCalculator} = await connection.getRecentBlockhash();

    // Calculate the cost to fund the greeter account
    fees += await connection.getMinimumBalanceForRentExemption(WEEKSLOT_SIZE);

    // Calculate the cost of sending transactions
    fees += feeCalculator.lamportsPerSignature * 100; // wag

    const payerKeyData = '[47,3,64,91,51,15,242,116,210,200,209,185,58,3,222,170,85,194,117,242,127,149,15,44,15,51,36,196,204,128,149,161,249,223,29,51,192,119,124,145,50,192,8,151,46,29,165,1,225,200,250,184,8,110,211,231,26,197,71,223,68,142,125,117]';
    const secretKey = Uint8Array.from(JSON.parse(payerKeyData));
    payer = Keypair.fromSecretKey(secretKey);
  }

  let lamports = await connection.getBalance(payer.publicKey);
  if (lamports < fees) {
    // If current balance is not enough to pay for fees, request an airdrop
    const sig = await connection.requestAirdrop(
      payer.publicKey,
      fees - lamports,
    );
    await connection.confirmTransaction(sig);
    lamports = await connection.getBalance(payer.publicKey);
  }

  console.log(
    'Using account',
    payer.publicKey.toBase58(),
    'containing',
    lamports / LAMPORTS_PER_SOL,
    'SOL to pay for fees',
  );
}

/**
 * Check if the hello world BPF program has been deployed
 */
export async function checkProgram(): Promise<void> {
  // Read program id from keypair file
  const programKey = '[166,21,242,30,145,233,15,224,253,192,73,227,27,208,195,145,170,147,180,13,233,4,144,211,241,200,155,195,55,87,8,97,3,187,13,217,148,60,202,15,247,2,234,73,232,182,7,131,103,4,242,247,141,162,86,204,134,23,12,35,83,222,124,23]';
  const secretKey = Uint8Array.from(JSON.parse(programKey));
  const programKeypair = Keypair.fromSecretKey(secretKey);
  programId = programKeypair.publicKey;

  // Check if the program has been deployed
  const programInfo = await connection.getAccountInfo(programId);
  
  console.log(`Using program ${programId.toBase58()}`);

  // Derive the address (public key) of a greeting account from the program so that it's easy to find later.
  const PROGRAM_SEED = 'hello';
  weekslotPubkey = await PublicKey.createWithSeed(
    payer.publicKey,
    PROGRAM_SEED,
    programId,
  );

  console.log('struct size: ' + WEEKSLOT_SIZE);

  // Check if the greeting account has already been created
  const weekslotAccount = await connection.getAccountInfo(weekslotPubkey);
}

/**
 * Say hello
 */
export async function updateWeekSlot(day: number, hour: number, state: boolean): Promise<void> {
  console.log('Updating Weekslot on blockchain program: ', weekslotPubkey.toBase58());
  const instruction = new TransactionInstruction({
    keys: [{pubkey: weekslotPubkey, isSigner: false, isWritable: true}],
    programId,
    data: createParamData(day, hour, state), // data parameters to pass into blockchain program
  });
  await sendAndConfirmTransaction(
    connection,
    new Transaction().add(instruction),
    [payer],
  );
}

function createParamData(day: number, hour: number, state: boolean): Buffer {
  /*
  const dataLayout = BufferLayout.struct(
      [BufferLayout.u8('day'),
       BufferLayout.u8('hour'),
       BufferLayout.u8('state')]);

  const data = Buffer.alloc(dataLayout.span);
  dataLayout.encode(
    {
      day: day,
      hour: hour,
      state: (state) ? 1 : 0
    },
    data,
  );
  */

  const data = Buffer.alloc(3);
  data.writeUInt8(0, 0);
  data.writeUInt8(11, 1);
  data.writeUInt8(1, 2);
  
  for(let i=0; i < data.byteLength; ++i) {
    console.log(data.readUInt8(i));
  }
  
  return data;
}

/**
 * Report the number of times the greeted account has been said hello to
 */
export async function reportGreetings(): Promise<void> {
  const accountInfo = await connection.getAccountInfo(weekslotPubkey);
  if (accountInfo === null) {
    throw 'Error: cannot find the greeted account';
  }
  const greeting = borsh.deserialize(
    WeekSlotSchema,
    WeekSlotAccount,
    accountInfo.data,
  );
  let buffer = accountInfo.data;
  for(let i=0; i < buffer.byteLength / 4; ++i) {
    console.log(buffer.readUInt32LE(i));
  }

  console.log(
    weekslotPubkey.toBase58(),
    'has slot 1 with value ',
    greeting.slot1
  );
}
