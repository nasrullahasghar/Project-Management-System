using Microsoft.EntityFrameworkCore;
using ProjectManagementApi.Models;

namespace ProjectManagementApi.Data;

public class AppDbContext : DbContext
{
    public AppDbContext(DbContextOptions<AppDbContext> options) : base(options)
    {
    }

    public DbSet<User> Users { get; set; }
    public DbSet<Project> Projects { get; set; }
    public DbSet<TaskItem> Tasks { get; set; }
    public DbSet<TeamMember> TeamMembers { get; set; }
    public DbSet<ActivityLog> ActivityLogs { get; set; }

    protected override void OnModelCreating(ModelBuilder modelBuilder)
    {
        base.OnModelCreating(modelBuilder);

        // Prevent duplicate team memberships (same user added twice to same project)
        modelBuilder.Entity<TeamMember>()
            .HasIndex(tm => new { tm.ProjectId, tm.UserId })
            .IsUnique();

        // Ensure emails are unique
        modelBuilder.Entity<User>()
            .HasIndex(u => u.Email)
            .IsUnique();

        // A User connects to Task in two ways (AssignedToUser) and to Project
        // in two ways (CreatedByUser via Project, AssignedToUser via Task).
        // By default EF Core cascades deletes along every foreign key relationship.
        // If you deleted a User, EF Core wouldn't know whether to cascade-delete
        // their tasks, their projects, etc., and Postgres would refuse the migration
        // with a "multiple cascade paths" error. So we turn cascading off on the
        // optional relationships and let those foreign keys just become NULL instead.
        modelBuilder.Entity<TaskItem>()
            .HasOne(t => t.AssignedToUser)
            .WithMany(u => u.TasksAssigned)
            .OnDelete(DeleteBehavior.SetNull);

        modelBuilder.Entity<ActivityLog>()
            .HasOne(a => a.Project)
            .WithMany()
            .OnDelete(DeleteBehavior.SetNull);

        modelBuilder.Entity<ActivityLog>()
            .HasOne(a => a.Task)
            .WithMany()
            .OnDelete(DeleteBehavior.SetNull);
    }
}