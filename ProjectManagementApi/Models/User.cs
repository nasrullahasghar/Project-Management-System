namespace ProjectManagementApi.Models;

public class User
{
    public int Id { get; set; }
    public string FullName { get; set; } = string.Empty;
    public string Email { get; set; } = string.Empty;
    public string PasswordHash { get; set; } = string.Empty;
    public string Role { get; set; } = "TeamMember"; // Admin, ProjectManager, TeamMember
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

    // Navigation properties - things this user is connected to
    public ICollection<Project> ProjectsCreated { get; set; } = new List<Project>();
    public ICollection<TaskItem> TasksAssigned { get; set; } = new List<TaskItem>();
    public ICollection<TeamMember> TeamMemberships { get; set; } = new List<TeamMember>();
}