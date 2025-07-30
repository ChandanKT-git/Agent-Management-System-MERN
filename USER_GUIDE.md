# User Guide - MERN Agent Management System

This guide provides step-by-step instructions for using the MERN Agent Management System to manage agents and distribute tasks from CSV files.

## Table of Contents

1. [Getting Started](#getting-started)
2. [Login and Authentication](#login-and-authentication)
3. [Dashboard Overview](#dashboard-overview)
4. [Managing Agents](#managing-agents)
5. [Uploading and Distributing Files](#uploading-and-distributing-files)
6. [Viewing Distributions](#viewing-distributions)
7. [Managing Tasks](#managing-tasks)
8. [Troubleshooting](#troubleshooting)
9. [Best Practices](#best-practices)

## Getting Started

### System Requirements

- Modern web browser (Chrome, Firefox, Safari, Edge)
- Internet connection
- Admin credentials provided by your system administrator

### Accessing the Application

1. Open your web browser
2. Navigate to the application URL (e.g., `http://localhost:3000` for development)
3. You will be redirected to the login page if not already authenticated

## Login and Authentication

### Logging In

1. **Enter Credentials**
   - Email: Enter your admin email address
   - Password: Enter your secure password

2. **Click Login**
   - The system will validate your credentials
   - Upon successful login, you'll be redirected to the dashboard

3. **Authentication Errors**
   - Invalid credentials: Check your email and password
   - Account locked: Contact your administrator
   - Network issues: Check your internet connection

### Session Management

- **Session Duration**: Your session remains active for 24 hours
- **Auto Logout**: You'll be automatically logged out when the session expires
- **Manual Logout**: Click the logout button in the top navigation

## Dashboard Overview

The dashboard provides a comprehensive overview of your agent management system:

### Key Metrics
- **Total Agents**: Number of registered agents
- **Active Agents**: Number of currently active agents
- **Recent Distributions**: Latest file uploads and distributions
- **Task Statistics**: Overview of assigned and completed tasks

### Navigation Menu
- **Dashboard**: Main overview page
- **Agents**: Manage agent profiles
- **Upload**: Upload and distribute CSV files
- **Distributions**: View distribution history
- **Profile**: Manage your account settings

## Managing Agents

### Viewing Agents

1. **Navigate to Agents**
   - Click "Agents" in the main navigation
   - View the list of all registered agents

2. **Agent Information Displayed**
   - Name and email address
   - Mobile number with country code
   - Status (Active/Inactive)
   - Registration date
   - Number of assigned tasks

3. **Sorting and Filtering**
   - Sort by name, email, or registration date
   - Filter by active/inactive status
   - Use search to find specific agents

### Adding New Agents

1. **Click "Add Agent" Button**
   - Located at the top of the agents list

2. **Fill Required Information**
   - **Name**: Full name of the agent (2-50 characters)
   - **Email**: Valid email address (must be unique)
   - **Mobile Number**: 
     - Country code (e.g., +1, +44, +91)
     - Phone number (10-15 digits)
   - **Password**: Secure password (minimum 6 characters)

3. **Submit the Form**
   - Click "Create Agent" to save
   - Success message will confirm creation
   - New agent appears in the agents list

### Editing Agent Information

1. **Select Agent to Edit**
   - Click the "Edit" button next to the agent's name
   - Or click on the agent's name to view details, then click "Edit"

2. **Update Information**
   - Modify any field except the email (email changes require special handling)
   - All fields are optional during updates

3. **Save Changes**
   - Click "Update Agent" to save changes
   - Confirmation message will appear

### Deactivating/Activating Agents

1. **Change Agent Status**
   - Use the toggle switch next to the agent's name
   - Or edit the agent and change the "Active" status

2. **Impact of Deactivation**
   - Inactive agents won't receive new task assignments
   - Existing tasks remain assigned
   - Agent can be reactivated at any time

### Deleting Agents

1. **Delete Agent**
   - Click the "Delete" button next to the agent's name
   - Confirm deletion in the popup dialog

2. **Important Notes**
   - Deletion is permanent and cannot be undone
   - All assigned tasks will be orphaned
   - Consider deactivating instead of deleting

## Uploading and Distributing Files

### Supported File Formats

- **CSV**: Comma-separated values (.csv)
- **Excel**: Microsoft Excel files (.xlsx, .xls)
- **File Size**: Maximum 5MB per file

### Required Columns

Your file must contain these columns (case-sensitive):
- **FirstName**: Contact's first name
- **Phone**: Phone number (any format)
- **Notes**: Additional notes or comments

### Upload Process

1. **Navigate to Upload Page**
   - Click "Upload" in the main navigation

2. **Select File**
   - Click "Choose File" or drag and drop your file
   - File validation occurs automatically

3. **File Validation**
   - System checks file format and structure
   - Preview shows first few rows
   - Error messages appear if validation fails

4. **Review and Confirm**
   - Check the file preview
   - Verify total number of records
   - Click "Upload and Distribute" to proceed

### Distribution Algorithm

The system automatically distributes tasks among agents:

1. **Equal Distribution**
   - Tasks are divided equally among 5 active agents
   - If fewer than 5 agents exist, distribution occurs among available agents

2. **Remainder Handling**
   - Extra tasks (when total isn't divisible by agent count) are distributed sequentially
   - First agents receive one additional task each

3. **Example**
   - 100 tasks, 5 agents: Each agent gets 20 tasks
   - 102 tasks, 5 agents: 2 agents get 21 tasks, 3 agents get 20 tasks

### Upload Results

After successful upload:
- **Distribution Summary**: Shows how tasks were distributed
- **Agent Assignments**: Lists each agent and their task count
- **Distribution ID**: Unique identifier for tracking

## Viewing Distributions

### Distribution History

1. **Navigate to Distributions**
   - Click "Distributions" in the main navigation

2. **Distribution List**
   - View all previous file uploads
   - Information includes:
     - Original filename
     - Upload date and time
     - Total number of tasks
     - Distribution status
     - Uploaded by (admin user)

3. **Sorting and Filtering**
   - Sort by date, filename, or task count
   - Filter by date range or status

### Distribution Details

1. **View Specific Distribution**
   - Click on any distribution from the list

2. **Detailed Information**
   - **File Information**: Original name, upload date, total tasks
   - **Agent Assignments**: Each agent's assigned task count
   - **Task Progress**: Completed vs. assigned tasks
   - **Individual Tasks**: Detailed list of all tasks

3. **Export Options**
   - Download distribution summary
   - Export agent-specific task lists

## Managing Tasks

### Viewing Agent Tasks

1. **From Agents Page**
   - Click on an agent's name
   - View their assigned tasks

2. **From Distributions Page**
   - Click on a distribution
   - View tasks by agent

### Task Information

Each task displays:
- **Contact Details**: First name and phone number
- **Notes**: Additional information from the uploaded file
- **Status**: Assigned or Completed
- **Assignment Date**: When the task was assigned
- **Completion Date**: When marked as completed (if applicable)

### Task Status Management

1. **Marking Tasks Complete**
   - Click the checkbox next to completed tasks
   - Status updates automatically
   - Completion timestamp is recorded

2. **Bulk Operations**
   - Select multiple tasks using checkboxes
   - Use bulk actions to mark multiple tasks as complete

### Task Statistics

View comprehensive statistics:
- **Total Tasks**: All tasks in the system
- **Assigned Tasks**: Tasks waiting to be completed
- **Completed Tasks**: Finished tasks
- **Completion Rate**: Percentage of completed tasks

## Troubleshooting

### Common Issues and Solutions

#### Login Problems

**Issue**: Cannot log in with correct credentials
- **Solution**: Check for typos in email/password
- **Solution**: Clear browser cache and cookies
- **Solution**: Try a different browser

**Issue**: Session expires frequently
- **Solution**: Check system clock accuracy
- **Solution**: Avoid multiple browser tabs with the application

#### File Upload Issues

**Issue**: File upload fails
- **Solution**: Check file size (must be under 5MB)
- **Solution**: Verify file format (CSV, XLSX, XLS only)
- **Solution**: Ensure stable internet connection

**Issue**: "Missing required columns" error
- **Solution**: Verify your file has FirstName, Phone, and Notes columns
- **Solution**: Check column names for exact spelling and case
- **Solution**: Remove any extra spaces in column headers

**Issue**: File appears corrupted
- **Solution**: Re-save the file in the correct format
- **Solution**: Check for special characters in the data
- **Solution**: Try opening the file in Excel/spreadsheet software first

#### Agent Management Issues

**Issue**: Cannot create new agent
- **Solution**: Check if email address is already in use
- **Solution**: Verify all required fields are filled
- **Solution**: Ensure mobile number format is correct

**Issue**: Agent not receiving tasks
- **Solution**: Verify agent is marked as "Active"
- **Solution**: Check if agent was created before the distribution
- **Solution**: Ensure there are active agents available for distribution

#### Performance Issues

**Issue**: Application loads slowly
- **Solution**: Check internet connection speed
- **Solution**: Clear browser cache
- **Solution**: Close unnecessary browser tabs

**Issue**: Large file uploads timeout
- **Solution**: Split large files into smaller chunks
- **Solution**: Check network stability
- **Solution**: Try uploading during off-peak hours

### Error Messages

#### Authentication Errors
- **"Invalid credentials"**: Check email and password
- **"Session expired"**: Log in again
- **"Access denied"**: Contact administrator for permissions

#### File Upload Errors
- **"File too large"**: Reduce file size or split into multiple files
- **"Invalid file format"**: Use CSV, XLSX, or XLS format only
- **"Missing required columns"**: Add FirstName, Phone, and Notes columns

#### System Errors
- **"Server error"**: Try again later or contact support
- **"Network error"**: Check internet connection
- **"Database error"**: Contact system administrator

### Getting Help

1. **Check Error Messages**: Read error messages carefully for specific guidance
2. **Review This Guide**: Search for your specific issue in this document
3. **Contact Administrator**: Reach out to your system administrator
4. **Technical Support**: Create an issue in the project repository

## Best Practices

### File Preparation

1. **Data Quality**
   - Ensure phone numbers are properly formatted
   - Remove duplicate entries before upload
   - Verify all required columns are present
   - Use consistent data formatting

2. **File Organization**
   - Use descriptive filenames with dates
   - Keep backup copies of original files
   - Document any data transformations

### Agent Management

1. **Regular Maintenance**
   - Review agent list monthly
   - Deactivate agents who are no longer available
   - Update contact information as needed

2. **Task Distribution**
   - Maintain 5 active agents for optimal distribution
   - Monitor agent workloads regularly
   - Balance task assignments across agents

### Security Best Practices

1. **Password Management**
   - Use strong, unique passwords
   - Change passwords regularly
   - Don't share login credentials

2. **Data Protection**
   - Log out when finished using the system
   - Don't leave the application open on shared computers
   - Report any security concerns immediately

### Workflow Optimization

1. **Regular Uploads**
   - Upload files in manageable batches
   - Schedule uploads during low-traffic periods
   - Monitor distribution results

2. **Progress Tracking**
   - Review task completion rates regularly
   - Follow up on overdue tasks
   - Generate reports for management

### Maintenance Schedule

#### Daily Tasks
- Check for new distributions
- Monitor task completion progress
- Address any error notifications

#### Weekly Tasks
- Review agent performance
- Update agent information as needed
- Clean up completed distributions

#### Monthly Tasks
- Analyze system usage patterns
- Review and update agent roster
- Generate performance reports

## Advanced Features

### Keyboard Shortcuts

- **Ctrl+N**: Create new agent (on agents page)
- **Ctrl+U**: Navigate to upload page
- **Ctrl+D**: Navigate to distributions page
- **Escape**: Close modal dialogs

### Browser Compatibility

**Fully Supported**:
- Chrome 90+
- Firefox 88+
- Safari 14+
- Edge 90+

**Limited Support**:
- Internet Explorer (not recommended)
- Older browser versions

### Mobile Usage

The application is responsive and works on mobile devices:
- **Tablets**: Full functionality available
- **Smartphones**: Core features available with adapted interface
- **Touch Navigation**: Optimized for touch interactions

For the best experience, use the application on a desktop or laptop computer.

---

This user guide covers all major features of the MERN Agent Management System. For technical issues or feature requests, please contact your system administrator or refer to the project documentation.