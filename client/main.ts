/**
 * Week Slot
 */

import {
  establishConnection,
  establishPayer,
  checkProgram,
  updateWeekSlot,
  reportGreetings,
} from './weekslot';

async function main() {

  // Establish connection to the cluster
  await establishConnection();

  // Determine who pays for the fees
  await establishPayer();

  // Check if the program has been deployed
  await checkProgram();

  // Updating an account
  await updateWeekSlot(0, 11, true);

  // Find out how many times that account has been greeted
  await reportGreetings();

  console.log('Success');
}

main().then(
  () => process.exit(),
  err => {
    console.error(err);
    process.exit(-1);
  },
);
