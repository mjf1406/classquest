# ClassQuest

Your classroom. Gamified.
Dive into a world where education meets adventure!
Earn rewards, unlock achievements, and transform everyday learning into an epic quest.

This should not build

## Name Ideas

- Class Commander

## To-do List

### p5

- Learn [GoLang](https://www.youtube.com/watch?v=lNd7XlXwlho) in order to speed up data fetching by writing [the API](https://github.com/burakorkmez/react-go-tutorial/blob/master/main.go) in it
- Look into the APIs to determine the tier of a vocabulary word
  - [Datamuse API](https://www.datamuse.com/api/)
    https://www.npmjs.com/package/datamuse
  - [WordsAPI](https://www.wordsapi.com/)
- integrate Google Gemini API (because it's the only one that's free)
  - when exporting the generated content, ensure the answer key is on a separate page to the work sheet. Also, format these better than MagicSchoolAI. Their formatting is very rudimentary.
- integrate other models and let the user purchase tokens
  - Stripe
- tool: text scaffolder (duplicates [this](https://www.magicschool.ai/tools/text-scaffolder-tool). This tool only outputs vocabulary and questions, it does NOT scaffold.)
- worksheet: Custom (user picks and chooses which ones to include and the form is built dynamically to accommodate)
- worksheet: Vocabulary Hunt (uses the reading passage generator tool)
- worksheet: cloze
- worksheet: reading passage generator (similar to [this](https://www.magicschool.ai/tools/vocabulary-based-text-generator))
  - use morphological variations?
  - generate one for each student?
    - automatically set word count by the student's grade level
  - vocabulary input
  - topic input
  - length (only appears if **generate for each student** is unchecked)
  - grade level (only appears if **generate for each student** is unchecked)
  - generate comprehension questions?

### p4

- screen: Classroom Screen -- a screen that displays the clock and displays shuffler.
  - Shuffler can be run from another user session, like a phone, then the results will appear on the screen.
  - A timer can be set from another user session and will appear on the screen.
- screen: Teacher screen, in-class
  - quick access to randomizer, shuffler, create a timer -- all get pushed to the Classroom Screen
  - quick access to attendance, local chat, MagniText
  - quick access to each student to award/subtract points
    - can filter the students by group
  - can easily select multiple students
- tool: custom spinning wheels

### p3

- tool: classroom clock (duplicates [Class Timers](https://mjf1406.github.io/class-timers/index.html))
- tool: MagniText -- (duplicates [MagniText](https://mjf1406.github.io/magni-text/index.html))
- TOOL: Random Event -- randomly select an event for the class for the day
  - [ ] with/without replacement option
  - [ ] edit random event
  - [ ] create random event
  - [ ] delete random event
  - [ ] add default random events
  - [ ] per class basis
  - [ ] per group basis
- FEATURE: Power-ups -- For rewards that can be saved
  - Things like when you spin the wheel, you get 5 minutes of free time
  - needs a card on the Student Dashboard
- FEATURE: Levels
  - Allows student to choose, at each new level, new powers that they can use during class.

### p2

- worksheet: word search
- worksheet: scramble words
- worksheet: crossword
- tool: local chat -- launch a chat window that allows the device to be passed between parties to have a silent chat.
- tool: Shuffler -- shuffle history is now stored in the DB to persist across user sessions
- tool: Shuffler -- UI now indicates who has been first/last and how many times and on what date
- tool: Assigner, Round-Robin -- a history of items is now stored with a datetime object and is displayed in the UI as a table
- ⚠️ local-first: use [TinyBase](https://tinybase.org/) to implement a local-first architecture
  - there may be an option to use [Turso](https://turso.tech/local-first) in the future
- ⚠️ i18n: use [next-international](https://next-international.vercel.app/docs/app-setup) for localization
- Assigner: Round Robin -- need some tests for this one to ensure it's working.
- PAGE: assigner dashboard
  - quantity and date for Round-Robin
  - history for random and dates
  - just all the data for seats, like where they have sat and what dates, who they've sat next to, the teams they've been on, etc.
- FEATURE: Attendance
  - [x] stores presence and absence based on user's local time zone
  - [ ] prevents absent students from being awarded points
  - [ ] prevents absent students from losing points
  - [ ] prevents absent students from redeeming points
- BETA LAUNCH
  - Need to publish the app on [google console](https://console.cloud.google.com/auth/audience?authuser=0&inv=1&invt=AbmbDA&project=classcraft-clone)
  - Need to launch on [Clerk](https://clerk.com/docs/deployments/overview)
  - Add the site to Google Console so it appears on Google Search

### p1

- UX: Users can now add demo classes -- will need to do the following
  - **What if we just automatically give them assistant access to a pre-created demo class when they join the site?**
  1. Create a class for the user as the teacher called "RANDOM_ANIMAL - Demo" with year as current year.
  2. Insert students into `students` table.
  3. Insert students into `student_classes` table.
  4. Insert default behaviors
  5. Insert default redemption items
  6. Randomly award various behaviors
  7. Randomly have student redeem things
  8. soooooo many more
- FEATURE: Points -- track points on a per student, group, and class basis
  - [ ] award points
    - [x] to a single student
      - [x] clicking on the student opens a dialog with a grid list of all behaviors, with positive and needs work as tabs
      - [x] need a quantity that defaults to 1
    - [x] to selected students
    - [ ] streaks for behaviors
      - looks at patterns automatically, while ignoring the off days and off dates
      - for now, only see how many days in a row, look for the longest streak for each behavior
      - list the top 5 streaks on the card, prioritizing current streaks (need to do it today/next on day to continue), view all to see for each behavior
      - is it performed daily/weekly/monthly?
  - [ ] positive and negative behavior
    - [x] user can create them, setting an icon, name, and point value
    - [x] user can edit
    - [x] user can delete
    - [ ] teacher is notified when a student has a streak
  - [ ] Can delete on teacher-facing student dashboard
- PAGE: Class Dashboard
  - behavior streaks
    - positive
    - negative
- PAGE: Teacher-facing Student Dashboard
  - Group behaviors if they are the same time and same id like we have done on the student dashboard
- FEATURE: Assignments
  - Assignments Page
    - [x] create assignments
    - [ ] edit assignments
    - [ ] delete assignments
    - [x] create topics
    - [ ] edit topics
    - [ ] delete topics
    - [x] sortable table basics
    - [ ] can sort by multiple columns
    - [x] updates assignment status when checking/unchecking
    - [ ] add column for excused, which marks complete as false, but shows a blue checkbox with an X inside instead of an empty checkbox or checked version
    - Assignment Filters
      - [x] topic
      - [ ] due date
      - [ ] created date
      - [ ] working date
      - [ ] automatically exclude assignments that all students have done
    - [x] alert teacher every x minutes if a student hasn't completed an assignment
    - [ ] easily export URLs for each student
  - Student Page
    - fixed: resources links are now properly formatted as a list of links
    - fixed: the topic name is correctly displayed instead of its ID
    - [x] upcoming assignments that are due within 1 week
    - [ ] list of topics in the class
      - clicking on one takes to currentUrl/assignments
    - [ ] behavior breakdown
      - [ ] top 5 positive behaviors
      - [ ] top 5 negative behaviors
    - [ ] redemption breakdown
      - [ ] history
      - [ ] top 5 most common
    - [ ] absent dates
      - praise for 0 absent dates
      - top x% of the class
    - [ ] points summary
      - [ ] total points and ranking in the class with the values of those below and above
      - [ ] total points earned and ranking in the class with the values of those below and above
      - [ ] total redeemed points and ranking in the class with the values of those below and above
      - [ ] total negative points and ranking in the class with the values of those below and above
      - explainer saying something like "you would have [total points earned] if you didn't receive [negative points]! [something encouraging]
        - this should have a random message that has the same meaning each time they laod the page, maybe there are 10 different options
    - [ ] titles
    - [ ] achievements
    - [ ] streaks
    - [ ] expectations
- API Optimization 
    - store total points, redeemed points, and lost points in student_classes
    - 

### p0

- BUG: fixed a bug that would cause the mouse to click through the sorting dropdown .
- FEATURE: Expectations -- can edit expectations
- FEATURE: Expectations -- can delete expectations
- Branding: Pick a [name](https://docs.google.com/spreadsheets/d/1RoLmZ_o2Bnqvu4a_prFKneWKNbPndqWqoSxR9zfRgLE/edit?gid=0#gid=0)
- PAGE: Settings -- Need...
  1. Customizable achievement thresholds
  2. Select off days every week for Streaks
  3. Select dates that are not counted for Streaks
- DB: Need to ensure assistant teachers can only apply behaviors and mark/unmark tasks. Update backend to check role and return a 403 (Forbidden) if unauthorized.
- fixed an issue where rewarding points is no longer optimistic on the class page 
- The student dropdown on the class page also needs to have access to the student dashboard and the teacher facing dashboard 
- 

## Change Log

BE = backend
UX = user experience
UI = user interface
DB = database

2025/01/07

- UX: added a display in the form of a table to the Seats and Round Robin assigner on their respective pages

2025/01/06

- BE: reduced main API response time from an average of 1659.6ms to 603.7ms, an improvement of 63.6%!
- BE: test Drizzle query vs raw Turso query speed for `/api/getClassesGroupsStudents` -- It seems that they are effectively the same, so will continue to use drizzle
- UI: for assistant teachers, we hid the following UI elements
  - create task/topic
  - student action menu (edit/delete)
  - group action menu (edit/delete)
  - class action menu (edit/share/email/invite)
  - add student button
  - add group button

2025/01/04

- UX: now shows how many people are on the waitlist for public beta
- UI: basic titles added student dashboard, but maybe could use a better UI?
- UI: move class code to class action menu
- UX: deleting a class now had a loading state and deletes from all tables
- BE: if assistant teacher deletes class, they only remove themselves from the teacher_classes table
- UX: Added a shareable link (www.classquest.app/classes/import?class_code=CODE) that opens a dialog with a grid for positive/negative behaviors and reward items for import into a selected class.
- BE: Migrate API calls to run on the edge (Vercel).
- UX: Created a join class URL (www.classquest.app/classes?join_code=CODE) that auto-fills the code in the join modal, requiring only a "Join" click.

2025/01/03

- UX: added icons to represent primary/assistant teacher
- BE: fixed an error when the user has 0 Google Classroom courses.
- UI: redid the hero section to be more in line with [this vid](https://youtu.be/Toonu-cTE60?si=QoogG30Nb3JOD3nW&t=199).
- UX: added a way for users to sign up for the public beta

2025/01/02

- UI: removed achievement inputs when creating a new redemption item or behavior
- UI: users can now bulk send emails to all students their dashboards
- PAGE: Student Dashboard == added achievements that work by pulling thresholds from `ACHIEVEMENTS` in `constants.ts`. These achievements are applied to all behaviors and redemption items. Will add to settings in the future so they are adjustable.

2025/01/01

- UX: Each class now has a class code which can be used to join as an assistant teacher
- BUG: fixed an issue when deleting a class where the delete confirmation would immediately close upon opening.
- DB: added first name and last name columns for classes and updated all related instances to use these columns.
- DB: dropped \_old_push_classes and replaced it with the classes table.
- DB: enabled importing classes from templates and Google Classroom.
- UI: updated tooltips when creating a class to include default behaviors and rewards, then reload the page after adding them.

2024/12/31

- UI: added Dashboard, Tasks, and Expectations buttons to [groupId]

2024/12/19

- FEATURE: Expectations -- added a card to the student dashboard
- FEATURE: Expectations -- creating expectations is now optimistic
- FEATURE: Expectations -- on editing a student's expectation, the data is optimistically updated
- FEATURE: Expectations -- can edit an expectation for any given student
- FEATURE: Expectations -- can create an expectation
- UX: made the instructions collapsible in the all tasks modal on the student dashboard
- UX: added an alert that displays students who have not completed a task in the last 10 minutes on `/tasks`. This is filter-compliant.
- UI: fixed up some card wonky UI on the student dashboard
- UI: made the checkboxes larger on the tasks table
- UI: reduced the size of Student Action menu links and made them open in new tabs

2024/12/18

- UX: added a point display mode that only shows student numbers and their points. It's meant to be safe to show the entire class.
- UI: some enhancements to the student dashboard
- UI: some UI enhancements to the Tasks table

2024/12/17

- PAGE: student dashboard -- added a reward items grid so they know what they can purchase with their points
- UI: dramatically improved the look of the student dashboard
- UX: need to ensure the local timezone is used when rendering the date on the student dashboard
- PAGE: Tasks - auto award Task Completed on check, and delete the last one on uncheck
- PAGE: Tasks - somehow add in Student Dialog to make it easier to adjust points
- UX: groups CRUD operations are now optimistically updated
- UX: when editing a group's members or creating a group, the user can now set the selected students to the opposite of another group

2024/12/16

- UI: STUDENT DASHBOARD -- added "titles" in the form of seeing if the student is #1 in the class for which behaviors and showing it plus how many they are tied with
- backend: rate limiting is working again with Clerk login
- UI: teacher-facing student dashboard no longer includes redemptions in point history
- UI: changed student dashboard view details buttons to secondary from outline
- UI: mobile student grid now has 4 columns

2024/12/08

- UX: added basic date and topic filters to tasks table in `/tasks`
- UI: student-facing dashboard in its most basic form

2024/12/07

- backend: added redis rate limiting to prevent lots of calls to the API, thanks to [Upstash](https://upstash.com/)
- backend: student dashboards are now publicly accessible. It's secure because a bad actor would need to know two UUIDs, the class id and the student id in order to view the data.
- STUDENT: added a basic assignments page to the student dashboard `/classes/[classId]/students/[studentId]/assignments`
- fixed: Teaching-facing Student Dashboard now only counts actual negative behaviors as negative points
- fixed: Class Dashboard now only counts actual negative behaviors as negative points
- fixed: in the student dialog, the negative points are now correctly calculated
- UI: added a basic assignments page to track assignments that the students have done

2024/11/27

- UX: student total points no longer says they have insufficient points when they have sufficient points to purchase a reward

2024/11/24

- UI: added basis dialog when clicking on leaderboards in the class dashboard to display all data for the given leaderboard
- UI: on the class dashboard, added a negative behaviors leaderboard
- UI: achievements now show up in the edit behavior dialog
- DB: achievements are now saved when creating a behavior
- DB: achievements are now saved when creating an award item
- UX: can now edit a reward item without error
- UI: when opening the edit reward item, the correct item is now used to populate the dialog
- UI: the title is now populated when opening the reward item edit dialog

2024/11/22

- UX: title can be input for behaviors, but DO NOT currently function, i.e. they are not granted yet
- UX: basis teacher-facing student dashboard implemented
- DB: added points and absent_dates tables
- UI: turned the point and redemption history into tables

2024/11/21

- UI: removed max of 10 on remove and redeem quantities

2024/11/20

- UI: fixed poor padding on apply behavior dialog
- UX: when submitting a behavior through the apply button, it now disables multi-select mode
- UI: reduced the size of many elements in student and group grids when on mobile

2024/11/15

- UX: added more icons

2024/11/14

- UX: when sorting by points, they are now sorted from highest to smallest
- UX: the apply button now autodetect all present students if multi-select mode is inactive
- UI: fixed up the dialogs when awarding/removing points and redeeming to be more responsive and nice looking
- UX: added a button the user can click to add default behaviors and default redemption items
- fixed: the DB migration issue... kill me: see `drizzle-commands.md`
- UX: can track attendance and it properly loads when refreshing on any device! (unlike others 😉)
- UI: added redeem points tab to all apply behavior dialogs, including student dialog
- backend: student point data is now loaded into the group so it loads correctly on `[group_id]`

2024/10/13

- backend: erroneously omitted color from behaviors, and is now included
- UX: user can now edit and delete behaviors
- UX: users can now edit and delete students
- UX: users can now edit and delete groups
- added quantity to apply behavior dialogs

2024/10/12

- can apply behaviors to selected students
- fixed up drawer and dialog sizes on mobile
- behaviors can now be created
- user can now apply behaviors, awarding or removing points
- finished the client-side UI for the new classes view, setting everything up for adjusting points and tracking attendance
- attendance UI is done

2024/10/10

- switched the old view to edit class
- opening a class now displays a grid of students with non-functioning buttons and radio groups
- can now click into a group on the main class page

2024/10/08

- fixed: The output PDF now ensures that jobs with duplicate items gets printed correctly

2024/10/01

- fixed: groups are now in the UI upon creation, no longer requiring a refresh
- UI: user can now delete groups from the db
- fixed: student gender is now displayed in the students table
- fixed: Seats Assigner now correctly places students by sex and the output is ordered by seat number
- fixed: when opening a class, the class name now appears in the navbar instead of the class ID

2024/09/21

- fixed: minor bug when generating item_status for round robin and seat assigners

2024/09/19

- UI: small layout updates to SpinningWheel, removed the Spin button and made the wheel clickable
- UX: selected items are now removed when clicking Auto-remove selected items and then placed back when unchecking in SpinningWheel
- UI: small layout update to AnimatedShuffle2
- some changes to the homepage

2024/09/18

- UI: added wheel spinner to Randomizer
- UI: added fun shuffled animation to Shuffler

2024/09/15

- fixed: new sidebar now no longer has a scroll bar on mobile
- tool: Assigner, Seats MVP released

2024/09/14

- UI: in the NavBar, add the breadcrumb and create dropdowns for categories, e.g. if on the Randomizer page, then the user would see tools > Randomizer, and Tools would be a dropdown allowing them to select another tool
- fixed: Loading.tsx now loads a different loading message on every mount
- bug: fixed logo only appearing when sidebar is collapsed
- bug: fixed theme toggle icon being weird on scroll
- UI: set up the footer of the sidebar to have Clerk button, settings link, and theme toggle

2024/09/13

- Reading Passage is now a Generator
- URLs: put worksheet generators behind `/generators/`
- URLs: put tools behind `/tools/`
- backend: redid the round-robin assigner algo
- UX: updated the UI of both assigners, they are consistent and have no strange CLS now

2024/09/10

- backend: all data fetching is done using ReactQuery now

2024/08/27

- tool: Shuffler
- tool: Randomizer

2024/08/23

- added: Assigner, Round-Robin now allows for one boy and one girl to be selected if there are two jobs with the same name

2024/08/22

- fixed: server no longer loads stale data

2024/08/21

- fixed: the DB no longer has strange errors
- added: added [ALPHA] to the sidebar logo

2024/08/08

- added: Assigner, Round-Robin & user can download or print the resultant table as PDF
- added: Assigner, Random tool & user can download or print the resultant table as PDF

2024/08/06

- UX: user can add student(s) to an existing class
- UX: user can edit existing students (in the table?)

2024/08/05

- added: user can now edit groups
- UI: My Classes page works
- added: user can now create groups within classes
- UX: groups are now displayed on the `[classId]`
- added: user can add a class

2024/08/04

- UI: sidebar nav is used when a user is logged in
