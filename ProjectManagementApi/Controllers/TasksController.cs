using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using ProjectManagementApi.Data;
using ProjectManagementApi.DTOs;
using ProjectManagementApi.Models;

namespace ProjectManagementApi.Controllers;

[ApiController]
[Route("api/projects/{projectId}/tasks")] // nested under a project
[Authorize]
public class TasksController : ControllerBase
{
    private readonly AppDbContext _context;

    public TasksController(AppDbContext context)
    {
        _context = context;
    }

    // Small helper so we don't repeat this check in every action
    private async Task<bool> ProjectExists(int projectId)
    {
        return await _context.Projects.AnyAsync(p => p.Id == projectId);
    }

    // Normalizes any incoming DateTime to Kind=Utc so Npgsql accepts it
    // for the "timestamp with time zone" column type.
    private static DateTime? ToUtc(DateTime? date)
    {
        if (date == null) return null;

        return date.Value.Kind switch
        {
            DateTimeKind.Utc => date.Value,
            DateTimeKind.Local => date.Value.ToUniversalTime(),
            _ => DateTime.SpecifyKind(date.Value, DateTimeKind.Utc)
        };
    }

    // GET /api/projects/5/tasks
    [HttpGet]
    public async Task<ActionResult<IEnumerable<TaskDto>>> GetTasks(int projectId)
    {
        if (!await ProjectExists(projectId))
        {
            return NotFound(new { message = $"Project with id {projectId} not found." });
        }

        var tasks = await _context.Tasks
            .Where(t => t.ProjectId == projectId)
            .Select(t => new TaskDto
            {
                Id = t.Id,
                Title = t.Title,
                Description = t.Description,
                Status = t.Status,
                Priority = t.Priority,
                DueDate = t.DueDate,
                CreatedAt = t.CreatedAt,
                ProjectId = t.ProjectId,
                AssignedToUserId = t.AssignedToUserId,
                AssignedToUserName = t.AssignedToUser != null ? t.AssignedToUser.FullName : null
            })
            .ToListAsync();

        return Ok(tasks);
    }

    // GET /api/projects/5/tasks/12
    [HttpGet("{id}")]
    public async Task<ActionResult<TaskDto>> GetTask(int projectId, int id)
    {
        var task = await _context.Tasks
            .Where(t => t.Id == id && t.ProjectId == projectId)
            .Select(t => new TaskDto
            {
                Id = t.Id,
                Title = t.Title,
                Description = t.Description,
                Status = t.Status,
                Priority = t.Priority,
                DueDate = t.DueDate,
                CreatedAt = t.CreatedAt,
                ProjectId = t.ProjectId,
                AssignedToUserId = t.AssignedToUserId,
                AssignedToUserName = t.AssignedToUser != null ? t.AssignedToUser.FullName : null
            })
            .FirstOrDefaultAsync();

        if (task == null)
        {
            return NotFound(new { message = $"Task with id {id} not found in project {projectId}." });
        }

        return Ok(task);
    }

    // POST /api/projects/5/tasks
    [HttpPost]
    [Authorize(Roles = "Admin,ProjectManager")]
    public async Task<ActionResult<TaskDto>> CreateTask(int projectId, CreateTaskDto dto)
    {
        if (!await ProjectExists(projectId))
        {
            return NotFound(new { message = $"Project with id {projectId} not found." });
        }

        // If an assignee was given, make sure that user actually exists
        if (dto.AssignedToUserId.HasValue)
        {
            var userExists = await _context.Users.AnyAsync(u => u.Id == dto.AssignedToUserId.Value);
            if (!userExists)
            {
                return BadRequest(new { message = $"User with id {dto.AssignedToUserId} does not exist." });
            }
        }

        var task = new TaskItem
        {
            Title = dto.Title,
            Description = dto.Description,
            Priority = dto.Priority,
            DueDate = ToUtc(dto.DueDate),
            Status = "ToDo",
            ProjectId = projectId,
            AssignedToUserId = dto.AssignedToUserId
        };

        _context.Tasks.Add(task);
        await _context.SaveChangesAsync();

        string? assignedName = null;
        if (task.AssignedToUserId.HasValue)
        {
            await _context.Entry(task).Reference(t => t.AssignedToUser).LoadAsync();
            assignedName = task.AssignedToUser?.FullName;
        }

        var resultDto = new TaskDto
        {
            Id = task.Id,
            Title = task.Title,
            Description = task.Description,
            Status = task.Status,
            Priority = task.Priority,
            DueDate = task.DueDate,
            CreatedAt = task.CreatedAt,
            ProjectId = task.ProjectId,
            AssignedToUserId = task.AssignedToUserId,
            AssignedToUserName = assignedName
        };

        return CreatedAtAction(nameof(GetTask), new { projectId, id = task.Id }, resultDto);
    }

    // PUT /api/projects/5/tasks/12
    [HttpPut("{id}")]
    [Authorize(Roles = "Admin,ProjectManager")]
    public async Task<IActionResult> UpdateTask(int projectId, int id, UpdateTaskDto dto)
    {
        var task = await _context.Tasks
            .FirstOrDefaultAsync(t => t.Id == id && t.ProjectId == projectId);

        if (task == null)
        {
            return NotFound(new { message = $"Task with id {id} not found in project {projectId}." });
        }

        if (dto.AssignedToUserId.HasValue)
        {
            var userExists = await _context.Users.AnyAsync(u => u.Id == dto.AssignedToUserId.Value);
            if (!userExists)
            {
                return BadRequest(new { message = $"User with id {dto.AssignedToUserId} does not exist." });
            }
        }

        task.Title = dto.Title;
        task.Description = dto.Description;
        task.Status = dto.Status;
        task.Priority = dto.Priority;
        task.DueDate = ToUtc(dto.DueDate);
        task.AssignedToUserId = dto.AssignedToUserId;

        await _context.SaveChangesAsync();

        return NoContent();
    }

    // DELETE /api/projects/5/tasks/12
    [HttpDelete("{id}")]
    [Authorize(Roles = "Admin,ProjectManager")]
    public async Task<IActionResult> DeleteTask(int projectId, int id)
    {
        var task = await _context.Tasks
            .FirstOrDefaultAsync(t => t.Id == id && t.ProjectId == projectId);

        if (task == null)
        {
            return NotFound(new { message = $"Task with id {id} not found in project {projectId}." });
        }

        _context.Tasks.Remove(task);
        await _context.SaveChangesAsync();

        return NoContent();
    }
}