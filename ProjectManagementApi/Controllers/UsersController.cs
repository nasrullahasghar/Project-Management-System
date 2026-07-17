using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using ProjectManagementApi.Data;
using ProjectManagementApi.DTOs;

namespace ProjectManagementApi.Controllers;

[ApiController]
[Route("api/[controller]")] // becomes /api/users
[Authorize(Roles = "Admin,ProjectManager")]
public class UsersController : ControllerBase
{
    private readonly AppDbContext _context;

    public UsersController(AppDbContext context)
    {
        _context = context;
    }

    // GET /api/users
    // GET /api/users?excludeProjectId=5
    [HttpGet]
    public async Task<ActionResult<IEnumerable<UserDto>>> GetUsers([FromQuery] int? excludeProjectId)
    {
        var query = _context.Users.AsQueryable();

        if (excludeProjectId.HasValue)
        {
            query = query.Where(u => !_context.TeamMembers
                .Any(tm => tm.ProjectId == excludeProjectId.Value && tm.UserId == u.Id));
        }

        var users = await query
            .Select(u => new UserDto
            {
                Id = u.Id,
                FullName = u.FullName,
                Email = u.Email,
                Role = u.Role
            })
            .ToListAsync();

        return Ok(users);
    }
}