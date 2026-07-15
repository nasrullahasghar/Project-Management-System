using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using ProjectManagementApi.Data;
using ProjectManagementApi.DTOs;
using ProjectManagementApi.Models;

namespace ProjectManagementApi.Controllers;

[ApiController]
[Route("api/projects/{projectId}/teammembers")]
[Authorize]
public class TeamMembersController : ControllerBase
{
    private readonly AppDbContext _context;

    public TeamMembersController(AppDbContext context)
    {
        _context = context;
    }

    private async Task<bool> ProjectExists(int projectId)
    {
        return await _context.Projects.AnyAsync(p => p.Id == projectId);
    }

    // GET /api/projects/5/teammembers
    [HttpGet]
    public async Task<ActionResult<IEnumerable<TeamMemberDto>>> GetTeamMembers(int projectId)
    {
        if (!await ProjectExists(projectId))
        {
            return NotFound(new { message = $"Project with id {projectId} not found." });
        }

        var members = await _context.TeamMembers
            .Where(tm => tm.ProjectId == projectId)
            .Select(tm => new TeamMemberDto
            {
                Id = tm.Id,
                RoleInProject = tm.RoleInProject,
                JoinedAt = tm.JoinedAt,
                ProjectId = tm.ProjectId,
                UserId = tm.UserId,
                UserFullName = tm.User.FullName,
                UserEmail = tm.User.Email
            })
            .ToListAsync();

        return Ok(members);
    }

    // POST /api/projects/5/teammembers
    [HttpPost]
    [Authorize(Roles = "Admin,ProjectManager")]
    public async Task<ActionResult<TeamMemberDto>> AddTeamMember(int projectId, AddTeamMemberDto dto)
    {
        if (!await ProjectExists(projectId))
        {
            return NotFound(new { message = $"Project with id {projectId} not found." });
        }

        var userExists = await _context.Users.AnyAsync(u => u.Id == dto.UserId);
        if (!userExists)
        {
            return BadRequest(new { message = $"User with id {dto.UserId} does not exist." });
        }

        // Check the unique index constraint ourselves first, so we can return
        // a clean 409 Conflict instead of letting Postgres throw an ugly
        // DbUpdateException when it hits the unique index.
        var alreadyMember = await _context.TeamMembers
            .AnyAsync(tm => tm.ProjectId == projectId && tm.UserId == dto.UserId);
        if (alreadyMember)
        {
            return Conflict(new { message = "This user is already a member of this project." });
        }

        var member = new TeamMember
        {
            ProjectId = projectId,
            UserId = dto.UserId,
            RoleInProject = dto.RoleInProject
        };

        _context.TeamMembers.Add(member);
        await _context.SaveChangesAsync();

        await _context.Entry(member).Reference(m => m.User).LoadAsync();

        var resultDto = new TeamMemberDto
        {
            Id = member.Id,
            RoleInProject = member.RoleInProject,
            JoinedAt = member.JoinedAt,
            ProjectId = member.ProjectId,
            UserId = member.UserId,
            UserFullName = member.User.FullName,
            UserEmail = member.User.Email
        };

        return CreatedAtAction(nameof(GetTeamMembers), new { projectId }, resultDto);
    }

    // PUT /api/projects/5/teammembers/12
    [HttpPut("{id}")]
    [Authorize(Roles = "Admin,ProjectManager")]
    public async Task<IActionResult> UpdateTeamMember(int projectId, int id, UpdateTeamMemberDto dto)
    {
        var member = await _context.TeamMembers
            .FirstOrDefaultAsync(tm => tm.Id == id && tm.ProjectId == projectId);

        if (member == null)
        {
            return NotFound(new { message = $"Team member with id {id} not found in project {projectId}." });
        }

        member.RoleInProject = dto.RoleInProject;
        await _context.SaveChangesAsync();

        return NoContent();
    }

    // DELETE /api/projects/5/teammembers/12
    [HttpDelete("{id}")]
    [Authorize(Roles = "Admin,ProjectManager")]
    public async Task<IActionResult> RemoveTeamMember(int projectId, int id)
    {
        var member = await _context.TeamMembers
            .FirstOrDefaultAsync(tm => tm.Id == id && tm.ProjectId == projectId);

        if (member == null)
        {
            return NotFound(new { message = $"Team member with id {id} not found in project {projectId}." });
        }

        _context.TeamMembers.Remove(member);
        await _context.SaveChangesAsync();

        return NoContent();
    }
}