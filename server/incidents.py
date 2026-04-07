"""
Incident Analysis Module — Convert incident text to CREE scenarios.

Takes raw incident reports and extracts signals to initialize
environment conditions for realistic incident response training.
"""

import re
from typing import Dict, Any


class IncidentAnalyzer:
    """Analyzes incident text and extracts key signals."""

    # Keywords for each signal type
    LATENCY_KEYWORDS = [
        'latency', 'slow', 'delay', 'response time', 'timeout', 'hangs',
        'lag', 'sluggish', 'stuck', 'unresponsive'
    ]

    ERROR_KEYWORDS = [
        'error', 'failure', 'failed', 'exception', '500', '502', '503',
        '504', 'crash', 'crashed', 'broken'
    ]

    THROUGHPUT_KEYWORDS = [
        'throughput', 'requests dropped', 'dropped', 'lost', 'queue',
        'backlog', 'peak', 'spike'
    ]

    CPU_KEYWORDS = [
        'cpu', 'processor', 'processing', 'compute', 'load', 'utilization',
        'spinning', 'hot'
    ]

    CASCADE_KEYWORDS = [
        'cascade', 'cascading', 'propagat', 'spread', 'domino', 'chain reaction',
        'multiple services', 'downstream', 'all services'
    ]

    @staticmethod
    def analyze(incident_text: str) -> Dict[str, Any]:
        """
        Analyze incident text and extract signals.

        Args:
            incident_text: Raw incident report or log summary

        Returns:
            Dictionary with extracted signals and analysis
        """
        text_lower = incident_text.lower()

        # Extract signals
        signals = {
            'latency_spike': IncidentAnalyzer._has_keyword(
                text_lower, IncidentAnalyzer.LATENCY_KEYWORDS
            ),
            'error_rate_increase': IncidentAnalyzer._has_keyword(
                text_lower, IncidentAnalyzer.ERROR_KEYWORDS
            ),
            'throughput_drop': IncidentAnalyzer._has_keyword(
                text_lower, IncidentAnalyzer.THROUGHPUT_KEYWORDS
            ),
            'cpu_spike': IncidentAnalyzer._has_keyword(
                text_lower, IncidentAnalyzer.CPU_KEYWORDS
            ),
            'cascading_failures': IncidentAnalyzer._has_keyword(
                text_lower, IncidentAnalyzer.CASCADE_KEYWORDS
            ),
        }

        # Determine severity based on number and type of signals
        signal_count = sum(1 for v in signals.values() if v)
        if signals['cascading_failures']:
            severity = 'critical'
        elif signal_count >= 4:
            severity = 'critical'
        elif signal_count >= 3:
            severity = 'high'
        elif signal_count >= 2:
            severity = 'medium'
        else:
            severity = 'low'

        # Generate summary
        summary = IncidentAnalyzer._generate_summary(signals, incident_text)

        return {
            'incident_text': incident_text,
            'extracted_signals': signals,
            'summary': summary,
            'severity': severity,
            'signal_count': signal_count,
        }

    @staticmethod
    def _has_keyword(text: str, keywords: list) -> bool:
        """Check if any keyword appears in text."""
        for keyword in keywords:
            if keyword in text:
                return True
        return False

    @staticmethod
    def _generate_summary(signals: Dict[str, bool], incident_text: str) -> str:
        """Generate human-readable summary of detected signals."""
        detected = []

        if signals['latency_spike']:
            detected.append('elevated latency')
        if signals['error_rate_increase']:
            detected.append('increased errors')
        if signals['throughput_drop']:
            detected.append('reduced throughput')
        if signals['cpu_spike']:
            detected.append('high CPU')
        if signals['cascading_failures']:
            detected.append('cascading failures')

        if not detected:
            return 'Incident detected with unknown characteristics.'

        summary = f'Detected: {", ".join(detected)}.'

        # Extract first sentence from incident text for context
        first_sentence = incident_text.split('.')[0] if '.' in incident_text else incident_text[:100]
        if first_sentence:
            summary += f' Context: {first_sentence}.'

        return summary


def create_scenario_from_incident(analysis: Dict[str, Any]) -> Dict[str, Any]:
    """
    Convert incident analysis into CREE environment parameters.

    Args:
        analysis: Output from IncidentAnalyzer.analyze()

    Returns:
        Dictionary with environment initial state for the incident
    """
    signals = analysis['extracted_signals']
    severity = analysis['severity']

    # Map signals to environment state
    initial_hidden = {
        'system_mode': 'stressed' if severity in ['high', 'critical'] else 'stable',
        'risk_level': _severity_to_risk(severity),
        'memory_pressure': 0.0,
        'trigger_armed': signals['cascading_failures'],
        'cascade_counter': 0,
        'recovery_steps': 0,
        'consecutive_stress': 0,
        'last_actions': [],
    }

    # Adjust environment state based on detected signals
    if signals['latency_spike']:
        initial_hidden['risk_level'] += 2.0

    if signals['error_rate_increase']:
        initial_hidden['risk_level'] += 1.5

    if signals['throughput_drop']:
        initial_hidden['risk_level'] += 1.0

    if signals['cpu_spike']:
        initial_hidden['memory_pressure'] += 2.0
        initial_hidden['risk_level'] += 1.0

    if signals['cascading_failures']:
        initial_hidden['trigger_armed'] = True
        initial_hidden['risk_level'] = min(initial_hidden['risk_level'] + 3.0, 10.0)

    # Clamp values
    initial_hidden['risk_level'] = min(initial_hidden['risk_level'], 10.0)
    initial_hidden['memory_pressure'] = min(initial_hidden['memory_pressure'], 10.0)

    return {
        'task': 'recovery' if severity in ['high', 'critical'] else 'stability',
        'initial_hidden': initial_hidden,
        'severity': severity,
        'description': analysis['summary'],
    }


def _severity_to_risk(severity: str) -> float:
    """Map severity level to initial risk level."""
    return {
        'low': 2.0,
        'medium': 4.5,
        'high': 6.5,
        'critical': 8.0,
    }.get(severity, 2.0)
