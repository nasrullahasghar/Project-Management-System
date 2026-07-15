namespace ProjectManagementApi.Models;

public class TeamMember
{
    public int Id { get; set; }
    public string RoleInProject { get; set; } = "Contributor"; // Owner, Contributor, Viewer
    public DateTime JoinedAt { get; set; } = DateTime.UtcNow;

    public int ProjectId { get; set; }
    public Project Project { get; set; } = null!;

    public int UserId { get; set; }
    public User User { get; set; } = null!;
}