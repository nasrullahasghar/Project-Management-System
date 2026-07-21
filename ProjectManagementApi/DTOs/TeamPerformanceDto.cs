namespace ProjectManagementApi.DTOs
{
    public class TeamPerformanceReportDto
    {
        public int ProjectId { get; set; }
        public List<MemberPerformanceDto> Members { get; set; } = new();
    }

    public class MemberPerformanceDto
    {
        public int UserId { get; set; }
        public string UserName { get; set; } = string.Empty;
        public int AssignedCount { get; set; }
        public int CompletedCount { get; set; }
        public int OverdueCount { get; set; }
    }
}