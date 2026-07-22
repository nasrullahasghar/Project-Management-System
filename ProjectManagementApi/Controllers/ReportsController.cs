using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using ProjectManagementApi.Data;
using ProjectManagementApi.DTOs;

namespace ProjectManagementApi.Controllers
{
    [ApiController]
    [Route("api/reports")]
    [Authorize]
    public class ReportsController : ControllerBase
    {
        private readonly AppDbContext _context;

        public ReportsController(AppDbContext context)
        {
            _context = context;
        }

        // GET /api/reports/projects/{projectId}/progress
        [HttpGet("projects/{projectId}/progress")]
        public async Task<ActionResult<ProjectProgressDto>> GetProjectProgress(int projectId)
        {
            var project = await _context.Projects
                .Include(p => p.Tasks)
                .FirstOrDefaultAsync(p => p.Id == projectId);

            if (project == null)
                return NotFound($"Project with id {projectId} not found.");

            var tasks = project.Tasks;

            var totalTasks = tasks.Count;
            var completedTasks = tasks.Count(t => t.Status == "Done");

            var statusBreakdown = tasks
                .GroupBy(t => t.Status)
                .Select(g => new StatusCountDto
                {
                    Status = g.Key,
                    Count = g.Count()
                })
                .ToList();

            var dto = new ProjectProgressDto
            {
                ProjectId = project.Id,
                ProjectName = project.Name,
                TotalTasks = totalTasks,
                CompletedTasks = completedTasks,
                PercentComplete = totalTasks == 0 ? 0 : Math.Round((double)completedTasks / totalTasks * 100, 1),
                StatusBreakdown = statusBreakdown
            };

            return Ok(dto);
        }

        // GET /api/reports/task-completion?projectId={optional}&from={date}&to={date}
        [HttpGet("task-completion")]
        public async Task<ActionResult<TaskCompletionReportDto>> GetTaskCompletion(
            [FromQuery] int? projectId,
            [FromQuery] DateOnly? from,
            [FromQuery] DateOnly? to)
        {
            // Default to the last 30 days if no range is given
            var toDate = to ?? DateOnly.FromDateTime(DateTime.UtcNow);
            var fromDate = from ?? toDate.AddDays(-30);

            if (fromDate > toDate)
            {
                return BadRequest(new { message = "'from' date must be before 'to' date." });
            }

            var fromDateTime = fromDate.ToDateTime(TimeOnly.MinValue, DateTimeKind.Utc);
            var toDateTime = toDate.ToDateTime(TimeOnly.MaxValue, DateTimeKind.Utc);

            var query = _context.Tasks
                .Where(t => t.Status == "Done"
                        && t.CompletedAt != null
                        && t.CompletedAt >= fromDateTime
                        && t.CompletedAt <= toDateTime);

            if (projectId.HasValue)
            {
                query = query.Where(t => t.ProjectId == projectId.Value);
            }

            var completedTasks = await query.ToListAsync();

            // Group completions by calendar day
            var grouped = completedTasks
                .GroupBy(t => DateOnly.FromDateTime(t.CompletedAt!.Value))
                .ToDictionary(g => g.Key, g => g.Count());

            // Build every day in the range so the chart has no gaps, filling in 0 where nothing completed
            var dataPoints = new List<TaskCompletionPointDto>();
            for (var day = fromDate; day <= toDate; day = day.AddDays(1))
            {
                dataPoints.Add(new TaskCompletionPointDto
                {
                    Date = day,
                    CompletedCount = grouped.TryGetValue(day, out var count) ? count : 0
                });
            }

            var dto = new TaskCompletionReportDto
            {
                From = fromDate,
                To = toDate,
                DataPoints = dataPoints
            };

            return Ok(dto);
        }
        // GET /api/reports/projects/{projectId}/team-performance
        [HttpGet("projects/{projectId}/team-performance")]
        public async Task<ActionResult<TeamPerformanceReportDto>> GetTeamPerformance(int projectId)
        {
            if (!await _context.Projects.AnyAsync(p => p.Id == projectId))
            {
                return NotFound(new { message = $"Project with id {projectId} not found." });
            }

            var teamMembers = await _context.TeamMembers
                .Where(tm => tm.ProjectId == projectId)
                .Include(tm => tm.User)
                .ToListAsync();

            var tasks = await _context.Tasks
                .Where(t => t.ProjectId == projectId)
                .ToListAsync();

            var now = DateTime.UtcNow;

            var members = teamMembers.Select(tm =>
            {
                var memberTasks = tasks.Where(t => t.AssignedToUserId == tm.UserId).ToList();

                return new MemberPerformanceDto
                {
                    UserId = tm.UserId,
                    UserName = tm.User.FullName,
                    AssignedCount = memberTasks.Count,
                    CompletedCount = memberTasks.Count(t => t.Status == "Done"),
                    OverdueCount = memberTasks.Count(t =>
                        t.Status != "Done" && t.DueDate != null && t.DueDate < now)
                };
            }).ToList();

            var dto = new TeamPerformanceReportDto
            {
                ProjectId = projectId,
                Members = members
            };

            return Ok(dto);
        }
        // GET /api/reports/global-breakdown
        [HttpGet("global-breakdown")]
        public async Task<ActionResult<GlobalBreakdownDto>> GetGlobalBreakdown()
        {
            var tasks = await _context.Tasks.ToListAsync();

            var byStatus = tasks
                .GroupBy(t => t.Status)
                .Select(g => new StatusCountDto
                {
                    Status = g.Key,
                    Count = g.Count()
                })
                .ToList();

            var byPriority = tasks
                .GroupBy(t => t.Priority)
                .Select(g => new PriorityCountDto
                {
                    Priority = g.Key,
                    Count = g.Count()
                })
                .ToList();

            var dto = new GlobalBreakdownDto
            {
                ByStatus = byStatus,
                ByPriority = byPriority
            };

            return Ok(dto);
        }
    }
}