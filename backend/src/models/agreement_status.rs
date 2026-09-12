use serde::{Deserialize, Serialize};

#[derive(Debug, Clone, Copy, PartialEq, Eq, Serialize, Deserialize)]
pub enum AgreementStatus {
    Pending,
    Active,
    RevisionPending,
    CompletionPending,
    Completed,
    Rejected,
    Cancelled,
}

impl AgreementStatus {
    pub fn as_str(&self) -> &'static str {
        match self {
            Self::Pending => "Pending",
            Self::Active => "Active",
            Self::RevisionPending => "RevisionPending",
            Self::CompletionPending => "CompletionPending",
            Self::Completed => "Completed",
            Self::Rejected => "Rejected",
            Self::Cancelled => "Cancelled",
        }
    }

    pub fn from_str_lossy(s: &str) -> Option<Self> {
        match s {
            "Pending" => Some(Self::Pending),
            "Active" => Some(Self::Active),
            "RevisionPending" => Some(Self::RevisionPending),
            "CompletionPending" => Some(Self::CompletionPending),
            "Completed" => Some(Self::Completed),
            "Rejected" => Some(Self::Rejected),
            "Cancelled" => Some(Self::Cancelled),
            _ => None,
        }
    }

    pub fn can_perform(&self, action: &AgreementAction) -> bool {
        matches!(
            (self, action),
            (AgreementStatus::Pending, AgreementAction::Accept)
                | (AgreementStatus::Pending, AgreementAction::Reject)
                | (AgreementStatus::Pending, AgreementAction::Cancel)
                | (AgreementStatus::Active, AgreementAction::ProposeRevision)
                | (AgreementStatus::Active, AgreementAction::RequestCompletion)
                | (AgreementStatus::RevisionPending, AgreementAction::AcceptRevision)
                | (AgreementStatus::RevisionPending, AgreementAction::RejectRevision)
                | (AgreementStatus::CompletionPending, AgreementAction::ConfirmCompletion)
        )
    }

    pub fn next_status(&self, action: &AgreementAction) -> Result<AgreementStatus, &'static str> {
        if !self.can_perform(action) {
            return Err("Invalid state transition for current agreement status");
        }

        match (self, action) {
            (AgreementStatus::Pending, AgreementAction::Accept) => Ok(AgreementStatus::Active),
            (AgreementStatus::Pending, AgreementAction::Reject) => Ok(AgreementStatus::Rejected),
            (AgreementStatus::Pending, AgreementAction::Cancel) => Ok(AgreementStatus::Cancelled),
            (AgreementStatus::Active, AgreementAction::ProposeRevision) => Ok(AgreementStatus::RevisionPending),
            (AgreementStatus::Active, AgreementAction::RequestCompletion) => Ok(AgreementStatus::CompletionPending),
            (AgreementStatus::RevisionPending, AgreementAction::AcceptRevision) => Ok(AgreementStatus::Active),
            (AgreementStatus::RevisionPending, AgreementAction::RejectRevision) => Ok(AgreementStatus::Active),
            (AgreementStatus::CompletionPending, AgreementAction::ConfirmCompletion) => Ok(AgreementStatus::Completed),
            _ => Err("Unhandled state transition"),
        }
    }
}

#[allow(dead_code)]
#[derive(Debug, Clone, PartialEq, Eq)]
pub enum AgreementAction {
    Accept,
    Reject,
    ProposeRevision,
    AcceptRevision,
    RejectRevision,
    RequestCompletion,
    ConfirmCompletion,
    Cancel,
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_pending_transitions() {
        let status = AgreementStatus::Pending;
        assert!(status.can_perform(&AgreementAction::Accept));
        assert!(status.can_perform(&AgreementAction::Reject));
        assert!(status.can_perform(&AgreementAction::Cancel));
        assert!(!status.can_perform(&AgreementAction::ProposeRevision));
        assert!(!status.can_perform(&AgreementAction::RequestCompletion));

        assert_eq!(status.next_status(&AgreementAction::Accept).unwrap(), AgreementStatus::Active);
        assert_eq!(status.next_status(&AgreementAction::Reject).unwrap(), AgreementStatus::Rejected);
        assert_eq!(status.next_status(&AgreementAction::Cancel).unwrap(), AgreementStatus::Cancelled);
    }

    #[test]
    fn test_active_transitions() {
        let status = AgreementStatus::Active;
        assert!(status.can_perform(&AgreementAction::ProposeRevision));
        assert!(status.can_perform(&AgreementAction::RequestCompletion));
        assert!(!status.can_perform(&AgreementAction::Accept));
        assert!(!status.can_perform(&AgreementAction::Reject));

        assert_eq!(status.next_status(&AgreementAction::ProposeRevision).unwrap(), AgreementStatus::RevisionPending);
        assert_eq!(status.next_status(&AgreementAction::RequestCompletion).unwrap(), AgreementStatus::CompletionPending);
    }

    #[test]
    fn test_revision_pending_transitions() {
        let status = AgreementStatus::RevisionPending;
        assert!(status.can_perform(&AgreementAction::AcceptRevision));
        assert!(status.can_perform(&AgreementAction::RejectRevision));
        assert!(!status.can_perform(&AgreementAction::ProposeRevision));

        assert_eq!(status.next_status(&AgreementAction::AcceptRevision).unwrap(), AgreementStatus::Active);
        assert_eq!(status.next_status(&AgreementAction::RejectRevision).unwrap(), AgreementStatus::Active);
    }

    #[test]
    fn test_completion_pending_transitions() {
        let status = AgreementStatus::CompletionPending;
        assert!(status.can_perform(&AgreementAction::ConfirmCompletion));
        assert!(!status.can_perform(&AgreementAction::Accept));
        assert_eq!(status.next_status(&AgreementAction::ConfirmCompletion).unwrap(), AgreementStatus::Completed);
    }

    #[test]
    fn test_terminal_states_cannot_perform_actions() {
        let completed = AgreementStatus::Completed;
        assert!(!completed.can_perform(&AgreementAction::ProposeRevision));
        assert!(!completed.can_perform(&AgreementAction::RequestCompletion));
        assert!(completed.next_status(&AgreementAction::ProposeRevision).is_err());

        let rejected = AgreementStatus::Rejected;
        assert!(!rejected.can_perform(&AgreementAction::Accept));
        assert!(rejected.next_status(&AgreementAction::Accept).is_err());
    }
}
