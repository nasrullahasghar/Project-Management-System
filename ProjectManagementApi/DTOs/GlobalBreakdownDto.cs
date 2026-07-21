namespace ProjectManagementApi.DTOs
{
    public class GlobalBreakdownDto
    {
        public List<StatusCountDto> ByStatus { get; set; } = new();
        public List<PriorityCountDto> ByPriority { get; set; } = new();
    }

    public class PriorityCountDto
    {
        public string Priority { get; set; } = string.Empty;
        public int Count { get; set; }
    }
}