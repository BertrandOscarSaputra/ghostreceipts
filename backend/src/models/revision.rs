use chrono::{DateTime, Utc};
use serde::{Deserialize, Serialize};

#[derive(Debug, Clone, Serialize, Deserialize, PartialEq)]
pub struct DiffValue<T> {
    pub old: T,
    pub new: T,
}

#[derive(Debug, Clone, Copy, PartialEq, Eq, Serialize, Deserialize)]
pub enum PriceTrend {
    Increased,
    Decreased,
    Unchanged,
}

#[derive(Debug, Clone, Copy, PartialEq, Eq, Serialize, Deserialize)]
pub enum DeadlineTrend {
    Extended,
    Shortened,
    Unchanged,
}

#[derive(Debug, Clone, Serialize, Deserialize, PartialEq)]
pub struct AgreementDiff {
    pub from_version: i32,
    pub to_version: i32,
    pub title: Option<DiffValue<String>>,
    pub description: Option<DiffValue<Option<String>>>,
    pub amount: Option<DiffValue<Option<i64>>>,
    pub deadline: Option<DiffValue<Option<DateTime<Utc>>>>,
    pub price_trend: PriceTrend,
    pub deadline_trend: DeadlineTrend,
    pub has_changes: bool,
}

impl AgreementDiff {
    pub fn compute(
        from_version: i32,
        from_title: &str,
        from_description: Option<&str>,
        from_amount: Option<i64>,
        from_deadline: Option<DateTime<Utc>>,
        to_version: i32,
        to_title: &str,
        to_description: Option<&str>,
        to_amount: Option<i64>,
        to_deadline: Option<DateTime<Utc>>,
    ) -> Self {
        let title_diff = if from_title != to_title {
            Some(DiffValue {
                old: from_title.to_string(),
                new: to_title.to_string(),
            })
        } else {
            None
        };

        let desc_diff = if from_description != to_description {
            Some(DiffValue {
                old: from_description.map(|s| s.to_string()),
                new: to_description.map(|s| s.to_string()),
            })
        } else {
            None
        };

        let amount_diff = if from_amount != to_amount {
            Some(DiffValue {
                old: from_amount,
                new: to_amount,
            })
        } else {
            None
        };

        let deadline_diff = if from_deadline != to_deadline {
            Some(DiffValue {
                old: from_deadline,
                new: to_deadline,
            })
        } else {
            None
        };

        let price_trend = match (from_amount, to_amount) {
            (Some(o), Some(n)) if n > o => PriceTrend::Increased,
            (Some(o), Some(n)) if n < o => PriceTrend::Decreased,
            (None, Some(_)) => PriceTrend::Increased,
            (Some(_), None) => PriceTrend::Decreased,
            _ => PriceTrend::Unchanged,
        };

        let deadline_trend = match (from_deadline, to_deadline) {
            (Some(o), Some(n)) if n > o => DeadlineTrend::Extended,
            (Some(o), Some(n)) if n < o => DeadlineTrend::Shortened,
            (None, Some(_)) => DeadlineTrend::Extended,
            (Some(_), None) => DeadlineTrend::Shortened,
            _ => DeadlineTrend::Unchanged,
        };

        let has_changes = title_diff.is_some()
            || desc_diff.is_some()
            || amount_diff.is_some()
            || deadline_diff.is_some();

        Self {
            from_version,
            to_version,
            title: title_diff,
            description: desc_diff,
            amount: amount_diff,
            deadline: deadline_diff,
            price_trend,
            deadline_trend,
            has_changes,
        }
    }
}

#[derive(Debug, Deserialize, Serialize)]
pub struct ProposeRevisionRequest {
    pub actor_id: uuid::Uuid,
    pub title: String,
    pub description: Option<String>,
    pub amount: Option<i64>,
    pub deadline: Option<DateTime<Utc>>,
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_diff_computation_detects_price_increase_and_extended_deadline() {
        let t1 = Utc::now();
        let t2 = t1 + chrono::Duration::days(5);

        let diff = AgreementDiff::compute(
            1,
            "Website Design",
            Some("Landing page"),
            Some(500_000),
            Some(t1),
            2,
            "Website Design & Dev",
            Some("Landing page + mobile optimization"),
            Some(650_000),
            Some(t2),
        );

        assert!(diff.has_changes);
        assert_eq!(diff.from_version, 1);
        assert_eq!(diff.to_version, 2);
        assert_eq!(diff.price_trend, PriceTrend::Increased);
        assert_eq!(diff.deadline_trend, DeadlineTrend::Extended);
        assert!(diff.title.is_some());
        assert_eq!(diff.amount.unwrap().new, Some(650_000));
    }

    #[test]
    fn test_diff_computation_no_changes() {
        let t1 = Utc::now();

        let diff = AgreementDiff::compute(
            1,
            "Static Project",
            Some("Fixed scope"),
            Some(300_000),
            Some(t1),
            1,
            "Static Project",
            Some("Fixed scope"),
            Some(300_000),
            Some(t1),
        );

        assert!(!diff.has_changes);
        assert_eq!(diff.price_trend, PriceTrend::Unchanged);
        assert_eq!(diff.deadline_trend, DeadlineTrend::Unchanged);
        assert!(diff.title.is_none());
        assert!(diff.amount.is_none());
    }
}
