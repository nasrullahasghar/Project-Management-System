using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using ProjectManagementApi.Data;
using ProjectManagementApi.DTOs;
using ProjectManagementApi.Models;
using System.Security.Claims;

namespace ProjectManagementApi.Controllers;

[ApiController]
[Route("api/[controller]")] // becomes /api/projects
[Authorize]
public class ProjectsController : ControllerBase
{
    private readonly AppDbContext _context;

    // Constructor injection: ASP.NET Core creates the AppDbContext for us
    // (it's registered in Program.cs) and hands it in here automatically.
    public ProjectsController(AppDbContext context)
    {
        _context = context;
    }

    // GET /api/projects
    [HttpGet]
    public async Task<ActionResult<IEnumerable<ProjectDto>>> GetProjects()
    {
        var projects = await _context.Projects
            .Include(p => p.CreatedByUser)
            .Select(p => new ProjectDto
            {
                Id = p.Id,
                Name = p.Name,
                Description = p.Description,
                Status = p.Status,
                StartDate = p.StartDate,
                EndDate = p.EndDate,
                CreatedAt = p.CreatedAt,
                CreatedByUserId = p.CreatedByUserId,
                CreatedByUserName = p.CreatedByUser.FullName,
                TaskCount = p.Tasks.Count,
                TeamMemberCount = p.TeamMembers.Count
            })
            .ToListAsync();

        return Ok(projects);
    }

    // GET /api/projects/5
    [HttpGet("{id}")]
    public async Task<ActionResult<ProjectDto>> GetProject(int id)
    {
        var project = await _context.Projects
            .Include(p => p.CreatedByUser)
            .Where(p => p.Id == id)
            .Select(p => new ProjectDto
            {
                Id = p.Id,
                Name = p.Name,
                Description = p.Description,
                Status = p.Status,
                StartDate = p.StartDate,
                EndDate = p.EndDate,
                CreatedAt = p.CreatedAt,
                CreatedByUserId = p.CreatedByUserId,
                CreatedByUserName = p.CreatedByUser.FullName,
                TaskCount = p.Tasks.Count,
                TeamMemberCount = p.TeamMembers.Count
            })
            .FirstOrDefaultAsync();

        if (project == null)
        {
            return NotFound(new { message = $"Project with id {id} not found." });
        }

        return Ok(project);
    }

    // POST /api/projects
    [HttpPost]
    [Authorize(Roles = "Admin,ProjectManager")]
    public async Task<ActionResult<ProjectDto>> CreateProject(CreateProjectDto dto)
    {
        // Read the logged-in user's ID from the JWT claims (set in AuthController.GenerateJwtToken).
        // This replaces the old hardcoded "var createdByUserId = 1;" placeholder.
        var createdByUserId = int.Parse(User.FindFirstValue(ClaimTypes.NameIdentifier)!);

        var project = new Project
        {
            Name = dto.Name,
            Description = dto.Description,
            StartDate = dto.StartDate,
            EndDate = dto.EndDate,
            Status = "Planning",
            CreatedByUserId = createdByUserId
        };

        _context.Projects.Add(project);
        await _context.SaveChangesAsync();

        // Reload with the User included so we can build the DTO properly
        await _context.Entry(project).Reference(p => p.CreatedByUser).LoadAsync();

        var resultDto = new ProjectDto
        {
            Id = project.Id,
            Name = project.Name,
            Description = project.Description,
            Status = project.Status,
            StartDate = project.StartDate,
            EndDate = project.EndDate,
            CreatedAt = project.CreatedAt,
            CreatedByUserId = project.CreatedByUserId,
            CreatedByUserName = project.CreatedByUser.FullName,
            TaskCount = 0,
            TeamMemberCount = 0
        };

        // Returns 201 Created with a Location header pointing to GET /api/projects/{id}
        return CreatedAtAction(nameof(GetProject), new { id = project.Id }, resultDto);
    }

    // PUT /api/projects/5
    [HttpPut("{id}")]
    [Authorize(Roles = "Admin,ProjectManager")]
    public async Task<IActionResult> UpdateProject(int id, UpdateProjectDto dto)
    {
        var project = await _context.Projects.FindAsync(id);

        if (project == null)
        {
            return NotFound(new { message = $"Project with id {id} not found." });
        }

        project.Name = dto.Name;
        project.Description = dto.Description;
        project.Status = dto.Status;
        project.StartDate = dto.StartDate;
        project.EndDate = dto.EndDate;

        await _context.SaveChangesAsync();

        return NoContent(); // 204 - update succeeded, nothing to send back
    }

    // DELETE /api/projects/5
    [HttpDelete("{id}")]
    [Authorize(Roles = "Admin,ProjectManager")]
    public async Task<IActionResult> DeleteProject(int id)
    {
        var project = await _context.Projects.FindAsync(id);

        if (project == null)
        {
            return NotFound(new { message = $"Project with id {id} not found." });
        }

        _context.Projects.Remove(project);
        await _context.SaveChangesAsync();

        return NoContent();
    }
}