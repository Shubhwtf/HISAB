class JobError(Exception):
    pass


class RetryableJobError(JobError):
    pass


class NonRetryableJobError(JobError):
    pass


class InvalidOrganizationContextError(NonRetryableJobError):
    pass


class StaleJobError(NonRetryableJobError):
    pass
