use sha3::{Digest, Keccak256};
use uuid::Uuid;

use crate::models::agreement::{AgreementEvent, OnChainStatusResponse, OnChainTxSummary};

pub const DEFAULT_CONTRACT_ADDRESS: &str = "0x71C8A1d4f2081f215fAb4B95B8928373b5380F7C";
pub const DEFAULT_NETWORK: &str = "Sepolia Testnet (Chain ID 11155111)";
pub const DEFAULT_EXPLORER_BASE: &str = "https://sepolia.etherscan.io";

pub fn compute_on_chain_id(agreement_id: Uuid) -> String {
    let mut hasher = Keccak256::new();
    hasher.update(b"GhostReceiptAgreement:");
    hasher.update(agreement_id.as_bytes());
    let hash = hasher.finalize();
    format!("0x{}", hex::encode(hash))
}

pub fn generate_tx_hash(event_type: &str, agreement_id: Uuid, version: i32) -> String {
    let mut hasher = Keccak256::new();
    hasher.update(event_type.as_bytes());
    hasher.update(agreement_id.as_bytes());
    hasher.update(&version.to_be_bytes());
    hasher.update(&chrono::Utc::now().timestamp_nanos_opt().unwrap_or(0).to_be_bytes());
    let hash = hasher.finalize();
    format!("0x{}", hex::encode(hash))
}

pub fn build_on_chain_status(
    agreement_id: Uuid,
    on_chain_id: &str,
    current_version: i32,
    status: &str,
    events: &[AgreementEvent],
) -> OnChainStatusResponse {
    let transactions = events
        .iter()
        .filter_map(|e| {
            e.tx_hash.as_ref().map(|tx| OnChainTxSummary {
                event_type: e.event_type.clone(),
                tx_hash: tx.clone(),
                timestamp: e.created_at,
            })
        })
        .collect();

    OnChainStatusResponse {
        agreement_id,
        on_chain_id: on_chain_id.to_string(),
        current_version,
        status: status.to_string(),
        contract_address: DEFAULT_CONTRACT_ADDRESS.to_string(),
        network: DEFAULT_NETWORK.to_string(),
        explorer_url: format!("{}/address/{}", DEFAULT_EXPLORER_BASE, DEFAULT_CONTRACT_ADDRESS),
        transactions,
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_deterministic_on_chain_id() {
        let id = Uuid::new_v4();
        let hash1 = compute_on_chain_id(id);
        let hash2 = compute_on_chain_id(id);

        assert_eq!(hash1, hash2);
        assert!(hash1.starts_with("0x"));
        assert_eq!(hash1.len(), 66); // 0x + 64 hex chars
    }

    #[test]
    fn test_tx_hash_format() {
        let id = Uuid::new_v4();
        let tx = generate_tx_hash("AGREEMENT_CREATED", id, 1);
        assert!(tx.starts_with("0x"));
        assert_eq!(tx.len(), 66);
    }
}
