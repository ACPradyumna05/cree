"""Runtime singletons for API routers."""

from env.environment import BlackBoxEnvironment

_env: BlackBoxEnvironment | None = None


def get_env() -> BlackBoxEnvironment:
	"""Lazily create the legacy singleton environment.

	This keeps app startup fast for validators that probe /openapi.json and /health
	immediately after container wake-up.
	"""
	global _env
	if _env is None:
		_env = BlackBoxEnvironment()
	return _env
