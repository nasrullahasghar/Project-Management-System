namespace ProjectManagementApi.Models;

public class Project
{
    public int Id { get; set; }
    public string Name { get; set; } = string.Empty;
    public string? Description { get; set; }
    public string Status { get; set; } = "Planning"; // Planning, Active, Completed
    public DateTime? StartDate { get; set; }
    public DateTime? EndDate { get; set; }
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

    // Foreign key
    public int CreatedByUserId { get; set; }
    // Navigation property for that foreign key
    public User CreatedByUser { get; set; } = null!;

    // Navigation properties - things that belong to this project
    public ICollection<TaskItem> Tasks { get; set; } = new List<TaskItem>();
    public ICollection<TeamMember> TeamMembers { get; set; } = new List<TeamMember>();
}