class TestAlreadyRunningError(Exception):
    pass


class ServiceError(Exception):
    def __init__(self, service_name: str, message: str):
        self.service_name = service_name
        super().__init__(f"[{service_name}] {message}")
