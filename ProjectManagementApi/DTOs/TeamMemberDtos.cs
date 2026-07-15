namespace ProjectManagementApi.DTOs;

public class TeamMemberDto
{
    public int Id { get; set; }
    public string RoleInProject { get; set; } = string.Empty;
    public DateTime JoinedAt { get; set; }
    public int ProjectId { get; set; }
    public int UserId { get; set; }
    public string UserFullName { get; set; } = string.Empty;
    public string UserEmail { get; set; } = string.Empty;
}

public class AddTeamMemberDto
{
    public int UserId { get; set; }
    public string RoleInProject { get; set; } = "Contributor";
}

public class UpdateTeamMemberDto
{
    public string RoleInProject { get; set; } = string.Empty;
}