"""
Tool Configuration: Cost and latency data for different tool categories

This module contains the efficiency data for various tools across different
categories (calculators, search, data processing). Update these values to
match your actual tool implementations.
"""

# Calculator Tools Configuration
CALCULATOR_TOOLS = {
    "costs": {
        "basic_calculator": 0.0,
        "code_interpreter": 0.002,
        "wolfram_alpha": 0.01
    },
    "latencies": {  # in milliseconds
        "basic_calculator": 50,
        "code_interpreter": 200,
        "wolfram_alpha": 800
    }
}

# Search Tools Configuration
SEARCH_TOOLS = {
    "costs": {
        "local_index": 0.0,
        "vector_search": 0.001,
        "web_search": 0.003,
        "deep_research": 0.05
    },
    "latencies": {  # in milliseconds
        "local_index": 30,
        "vector_search": 150,
        "web_search": 400,
        "deep_research": 5000
    }
}

# Data Processing Tools Configuration
DATA_TOOLS = {
    "costs": {
        "simple_filter": 0.0,
        "sql_query": 0.001,
        "data_warehouse": 0.01,
        "ml_pipeline": 0.10
    },
    "latencies": {  # in milliseconds
        "simple_filter": 100,
        "sql_query": 300,
        "data_warehouse": 1500,
        "ml_pipeline": 8000
    }
}

# Efficiency Profile Presets
EFFICIENCY_PROFILES = {
    "cost_critical": {
        "cost_weight": 0.8,
        "latency_weight": 0.2,
        "threshold": 0.9,
        "description": "Batch processing, backend jobs where cost is the primary concern"
    },
    "latency_critical": {
        "cost_weight": 0.2,
        "latency_weight": 0.8,
        "threshold": 0.8,
        "description": "User-facing, real-time applications where speed is critical"
    },
    "balanced": {
        "cost_weight": 0.5,
        "latency_weight": 0.5,
        "threshold": 0.75,
        "description": "General purpose applications balancing cost and performance"
    }
}


def get_efficiency_config(profile: str) -> dict:
    """
    Get efficiency configuration for a given profile.
    
    Args:
        profile: Name of the efficiency profile ('cost_critical', 'latency_critical', 'balanced')
        
    Returns:
        Dictionary with cost_weight, latency_weight, and threshold values
    """
    if profile not in EFFICIENCY_PROFILES:
        raise ValueError(f"Unknown profile: {profile}. Available: {list(EFFICIENCY_PROFILES.keys())}")

    config = EFFICIENCY_PROFILES[profile]
    return {
        "cost_weight": config["cost_weight"],
        "latency_weight": config["latency_weight"],
        "threshold": config["threshold"]
    }
