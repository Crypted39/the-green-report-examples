import pytest
from datetime import datetime
from unittest.mock import Mock
from dataclasses import dataclass
from typing import Optional
import calendar


@dataclass
class Subscription:
    user_id: str
    plan_type: str
    start_date: datetime
    next_billing_date: datetime
    status: str
    amount: float
    cancelled_at: Optional[datetime] = None


class SubscriptionService:
    def __init__(self, payment_gateway, time_provider):
        self.payment_gateway = payment_gateway
        self.time_provider = time_provider
        self.subscriptions = {}

    def create_subscription(self, user_id: str, plan_type: str, amount: float) -> Subscription:
        current_time = self.time_provider.now()
        subscription = Subscription(
            user_id=user_id,
            plan_type=plan_type,
            start_date=current_time,
            next_billing_date=self._calculate_next_billing_date(current_time, plan_type),
            status="active",
            amount=amount
        )
        self.subscriptions[user_id] = subscription
        return subscription

    def _calculate_next_billing_date(self, current_date: datetime, plan_type: str) -> datetime:
        if plan_type == "monthly":
            # Get the last day of the next month
            if current_date.month == 12:
                next_month = 1
                next_year = current_date.year + 1
            else:
                next_month = current_date.month + 1
                next_year = current_date.year

            # Get the last day of the next month
            _, last_day = calendar.monthrange(next_year, next_month)

            # Create the next billing date
            next_date = datetime(
                year=next_year,
                month=next_month,
                day=min(current_date.day, last_day),  # Handle months with different lengths
                hour=current_date.hour,
                minute=current_date.minute
            )
            return next_date
        elif plan_type == "yearly":
            next_year = current_date.year + 1
            # Handle February 29th for leap years
            if current_date.month == 2 and current_date.day == 29:
                if not calendar.isleap(next_year):
                    return datetime(next_year, 2, 28,
                                    current_date.hour, current_date.minute)
            return datetime(next_year, current_date.month, current_date.day,
                            current_date.hour, current_date.minute)
        raise ValueError(f"Unsupported plan type: {plan_type}")

    def process_recurring_payments(self):
        current_time = self.time_provider.now()
        for subscription in self.subscriptions.values():
            if (subscription.status == "active" and
                    subscription.next_billing_date <= current_time):
                try:
                    self.payment_gateway.charge(
                        subscription.user_id,
                        subscription.amount
                    )
                    subscription.next_billing_date = self._calculate_next_billing_date(
                        subscription.next_billing_date,  # Use next_billing_date instead of current_time
                        subscription.plan_type
                    )
                except PaymentError:
                    subscription.status = "payment_failed"

    def cancel_subscription(self, user_id: str):
        if user_id in self.subscriptions:
            self.subscriptions[user_id].status = "cancelled"
            self.subscriptions[user_id].cancelled_at = self.time_provider.now()


class PaymentError(Exception):
    pass


# Tests
class TestSubscriptionService:
    @pytest.fixture
    def mock_payment_gateway(self):
        return Mock()

    @pytest.fixture
    def mock_time_provider(self):
        provider = Mock()
        provider.now.return_value = datetime(2024, 1, 1, 12, 0)
        return provider

    @pytest.fixture
    def subscription_service(self, mock_payment_gateway, mock_time_provider):
        return SubscriptionService(mock_payment_gateway, mock_time_provider)

    def test_create_monthly_subscription(self, subscription_service):
        subscription = subscription_service.create_subscription(
            "user1", "monthly", 9.99
        )
        assert subscription.status == "active"
        assert subscription.next_billing_date == datetime(2024, 2, 1, 12, 0)

    def test_successful_recurring_payment(self,
                                          subscription_service,
                                          mock_payment_gateway,
                                          mock_time_provider):
        # Create subscription
        subscription = subscription_service.create_subscription(
            "user1", "monthly", 9.99
        )

        # Simulate time passing to next billing date
        mock_time_provider.now.return_value = subscription.next_billing_date

        # Process payment
        subscription_service.process_recurring_payments()

        # Verify payment was processed
        mock_payment_gateway.charge.assert_called_once_with("user1", 9.99)
        assert subscription.status == "active"
        assert subscription.next_billing_date == datetime(2024, 3, 1, 12, 0)

    def test_edge_cases_monthly_billing(self, subscription_service, mock_time_provider):
        # Test January 31st subscription
        mock_time_provider.now.return_value = datetime(2024, 1, 31, 12, 0)
        jan_subscription = subscription_service.create_subscription(
            "user1", "monthly", 9.99
        )
        assert jan_subscription.next_billing_date == datetime(2024, 2, 29, 12, 0)  # Leap year

        # Test February 29th subscription (leap year)
        mock_time_provider.now.return_value = datetime(2024, 2, 29, 12, 0)
        feb_subscription = subscription_service.create_subscription(
            "user2", "monthly", 9.99
        )
        assert feb_subscription.next_billing_date == datetime(2024, 3, 29, 12, 0)

    def test_failed_recurring_payment(self,
                                      subscription_service,
                                      mock_payment_gateway,
                                      mock_time_provider):
        # Create subscription
        subscription = subscription_service.create_subscription(
            "user1", "monthly", 9.99
        )

        # Simulate payment failure
        mock_payment_gateway.charge.side_effect = PaymentError()

        # Simulate time passing to next billing date
        mock_time_provider.now.return_value = subscription.next_billing_date

        # Process payment
        subscription_service.process_recurring_payments()

        # Verify subscription status changed
        assert subscription.status == "payment_failed"

    def test_subscription_cancellation(self, subscription_service):
        # Create and cancel subscription
        subscription = subscription_service.create_subscription(
            "user1", "monthly", 9.99
        )
        subscription_service.cancel_subscription("user1")

        # Verify subscription was cancelled
        assert subscription.status == "cancelled"
        assert subscription.cancelled_at is not None

    def test_no_charge_after_cancellation(self,
                                          subscription_service,
                                          mock_payment_gateway,
                                          mock_time_provider):
        # Create and cancel subscription
        subscription = subscription_service.create_subscription(
            "user1", "monthly", 9.99
        )
        subscription_service.cancel_subscription("user1")

        # Simulate time passing to next billing date
        mock_time_provider.now.return_value = subscription.next_billing_date

        # Process payments
        subscription_service.process_recurring_payments()

        # Verify no payment was processed
        mock_payment_gateway.charge.assert_not_called()
