using ProjectManagementApi.Models;

namespace ProjectManagementApi.Data;

public static class DbSeeder
{
    public static void Seed(AppDbContext context)
    {
        // If there's already data, don't seed again
        if (context.Users.Any())
        {
            return;
        }

        // Create sample users
        var admin = new User
        {
            FullName = "Nasrullah Khan",
            Email = "admin@example.com",
            PasswordHash = "placeholder-will-hash-later",
            Role = "Admin"
        };

        var manager = new User
        {
            FullName = "Sara Ahmed",
            Email = "sara@example.com",
            PasswordHash = "placeholder-will-hash-later",
            Role = "ProjectManager"
        };

        var member = new User
        {
            FullName = "Ali Raza",
            Email = "ali@example.com",
            PasswordHash = "placeholder-will-hash-later",
            Role = "TeamMember"
        };

        context.Users.AddRange(admin, manager, member);
        context.SaveChanges(); // Save now so these users get real IDs before we reference them below

        // Create a sample project
        var project = new Project
        {
            Name = "Internal Tools Revamp",
            Description = "Rebuild the internal admin dashboard",
            Status = "Active",
            StartDate = DateTime.UtcNow.AddDays(-10),
            EndDate = DateTime.UtcNow.AddDays(30),
            CreatedByUserId = manager.Id
        };

        context.Projects.Add(project);
        context.SaveChanges(); // Save so project gets a real ID

        // Add team members to the project
        context.TeamMembers.AddRange(
            new TeamMember { ProjectId = project.Id, UserId = manager.Id, RoleInProject = "Owner" },
            new TeamMember { ProjectId = project.Id, UserId = member.Id, RoleInProject = "Contributor" }
        );

        // Create sample tasks
        context.Tasks.AddRange(
            new TaskItem
            {
                Title = "Set up CI pipeline",
                Description = "Configure GitHub Actions for automated builds",
                Status = "InProgress",
                Priority = "High",
                ProjectId = project.Id,
                AssignedToUserId = member.Id,
                DueDate = DateTime.UtcNow.AddDays(5)
            },
            new TaskItem
            {
                Title = "Design new dashboard layout",
                Description = "Create wireframes for the new UI",
                Status = "ToDo",
                Priority = "Medium",
                ProjectId = project.Id,
                AssignedToUserId = manager.Id,
                DueDate = DateTime.UtcNow.AddDays(7)
            }
        );

        context.SaveChanges();
    }
}