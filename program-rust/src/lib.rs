use borsh::{BorshDeserialize, BorshSerialize};
use solana_program::{
    account_info::{next_account_info, AccountInfo},
    entrypoint,
    entrypoint::ProgramResult,
    msg,
    program_error::ProgramError,
    pubkey::Pubkey,
};

/// Define the type of state stored in accounts
#[derive(BorshSerialize, BorshDeserialize, Debug)]
pub struct WeekSlotAccount {
    /// number of slots
    pub slot1: u32,
    pub slot2: u32,
    pub slot3: u32,
    pub slot4: u32,
    pub slot5: u32,
    pub slot6: u32,
    pub slot7: u32,
}

// Declare and export the program's entrypoint
entrypoint!(process_instruction);

// Program entrypoint's implementation
pub fn process_instruction(
    program_id: &Pubkey, // Public key of the account the weekslot program was loaded into
    accounts: &[AccountInfo], // The account to call 
    instruction_data: &[u8], 
) -> ProgramResult {
    msg!("Week Slot Rust program entrypoint");

    // Iterating accounts is safer than indexing
    let accounts_iter = &mut accounts.iter();

    // Get the account to say hello to
    let account = next_account_info(accounts_iter)?;

    // The account must be owned by the program in order to modify its data
    if account.owner != program_id {
        msg!("Weekslot account does not have the correct program id");
        return Err(ProgramError::IncorrectProgramId);
    }

    let base: u32 = 2;
    let day = instruction_data[0] as usize;
    let hour = instruction_data[1] as u32;
    let set = if instruction_data[2] == 0 { false } else { true };

    let mut weekslot_account = WeekSlotAccount::try_from_slice(&account.data.borrow())?;

    match day {
        0 => { if set { weekslot_account.slot1 |= base.pow(hour); } else { weekslot_account.slot1 &= !base.pow(hour); } },
        1 => { if set { weekslot_account.slot2 |= base.pow(hour); } else { weekslot_account.slot2 &= !base.pow(hour); } },
        2 => { if set { weekslot_account.slot3 |= base.pow(hour); } else { weekslot_account.slot3 &= !base.pow(hour); } },
        3 => { if set { weekslot_account.slot4 |= base.pow(hour); } else { weekslot_account.slot4 &= !base.pow(hour); } },
        4 => { if set { weekslot_account.slot5 |= base.pow(hour); } else { weekslot_account.slot5 &= !base.pow(hour); } },
        5 => { if set { weekslot_account.slot6 |= base.pow(hour); } else { weekslot_account.slot6 &= !base.pow(hour); } },
        6 => { if set { weekslot_account.slot7 |= base.pow(hour); } else { weekslot_account.slot7 &= !base.pow(hour); } },
        _ => {},
    }
    
    weekslot_account.serialize(&mut &mut account.data.borrow_mut()[..])?;

    Ok(())
}
