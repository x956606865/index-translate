"""Exercise speech session configuration without native libraries or runtime data."""
import ast
import threading
import unittest
from pathlib import Path
from unittest.mock import Mock

# Only the relative state import is excluded: it starts unrelated runtime setup.
# Compile the actual service code, but construct instances without __init__ I/O.
source = Path(__file__).resolve().parents[1] / "app/speech_service.py"
module = ast.parse(source.read_text("utf-8"))
module.body = [node for node in module.body
               if not (isinstance(node, ast.ImportFrom) and node.level)]
namespace = {}
exec(compile(module, str(source), "exec"), namespace)
SpeechSessions = namespace["SpeechSessions"]


class TestSpeechLanguage(unittest.TestCase):
    def make_service(self):
        class ReadySessions(SpeechSessions):
            @property
            def available(self):
                return True

        service = ReadySessions.__new__(ReadySessions)
        service._lock = threading.RLock()
        service._owners = {"old": "owner"}
        service._finished = {}
        service._manager = Mock()
        service._manager.start_live.return_value = {"session_id": "new", "sample_rate": 16000}
        service.resolve_model = lambda: Path("mock-model")
        return service

    def test_default_and_explicit_language_forwarding(self):
        for language in namespace["get_args"](namespace["SpeechLanguage"]):
            with self.subTest(language=language):
                service = self.make_service()
                result = service.start("owner") if language == "Auto" else service.start("owner", language)
                self.assertEqual(result["language"], language)
                self.assertEqual(service._manager.start_live.call_args.args[1]["language"], language)
                self.assertEqual(service._owners, {"new": "owner"})

    def test_invalid_language_has_no_side_effects(self):
        for language in ("ja", "auto", "invalid", "", None, []):
            with self.subTest(language=language):
                service = self.make_service()
                with self.assertRaises(ValueError):
                    service.start("owner", language)
                self.assertEqual(service._owners, {"old": "owner"})
                service._manager.start_live.assert_not_called()
                service._manager.session_request.assert_not_called()


if __name__ == "__main__":
    unittest.main()
