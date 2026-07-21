namespace ProjectManagementApi.DTOs
{
    public class ProjectProgressDto
    {
        public int ProjectId { get; set; }
        public string ProjectName { get; set; } = string.Empty;
        public int TotalTasks { get; set; }
        public int CompletedTasks { get; set; }
        public double PercentComplete { get; set; }
        public List<StatusCountDto> StatusBreakdown { get; set; } = new();
    }

    public class StatusCountDto
    {
        public string Status { get; set; } = string.Empty;
        public int Count { get; set; }
    }
}