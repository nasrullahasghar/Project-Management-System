namespace ProjectManagementApi.Models;

public class TaskItem
{
    public int Id { get; set; }
    public string Title { get; set; } = string.Empty;
    public string? Description { get; set; }
    public string Status { get; set; } = "ToDo"; // ToDo, InProgress, Done
    public string Priority { get; set; } = "Medium"; // Low, Medium, High
    public DateTime? DueDate { get; set; }
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

    // Foreign key: which project this task belongs to
    public int ProjectId { get; set; }
    public Project Project { get; set; } = null!;

    // Foreign key: who it's assigned to (nullable - can be unassigned)
    public int? AssignedToUserId { get; set; }
    public User? AssignedToUser { get; set; }
}