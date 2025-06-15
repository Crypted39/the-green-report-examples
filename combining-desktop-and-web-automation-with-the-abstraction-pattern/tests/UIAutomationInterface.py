from abc import ABC, abstractmethod
from typing import Optional


class UIAutomationInterface(ABC):
    """Abstract base class defining the common interface for UI automation."""

    @abstractmethod
    def click(self, element_identifier: str) -> bool:
        """Click on an element identified by the given identifier."""
        pass

    @abstractmethod
    def type_text(self, element_identifier: str, text: str) -> bool:
        """Type text into an element."""
        pass

    @abstractmethod
    def find_element(self, element_identifier: str) -> Optional[object]:
        """Find and return an element."""
        pass

    @abstractmethod
    def get_text(self, element_identifier: str) -> str:
        """Get text content from an element."""
        pass

    @abstractmethod
    def wait_for_element(self, element_identifier: str, timeout: int = 10) -> bool:
        """Wait for an element to appear."""
        pass

    @abstractmethod
    def take_screenshot(self, filename: str) -> bool:
        """Take a screenshot."""
        pass

    @abstractmethod
    def close(self) -> None:
        """Clean up and close the automation session."""
        pass
