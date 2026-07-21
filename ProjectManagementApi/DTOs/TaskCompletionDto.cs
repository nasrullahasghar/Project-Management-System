namespace ProjectManagementApi.DTOs
{
    public class TaskCompletionReportDto
    {
        public DateOnly From { get; set; }
        public DateOnly To { get; set; }
        public List<TaskCompletionPointDto> DataPoints { get; set; } = new();
    }

    public class TaskCompletionPointDto
    {
        public DateOnly Date { get; set; }
        public int CompletedCount { get; set; }
    }
}