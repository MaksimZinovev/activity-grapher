Requirements:
app should allow entering activity data and visualising it with activity-graph Web Component created by github.com/hsablonniere/activity-graph (see attachment readme)
Requirements:

- self contained HTML + JS + CSS (single file)
- data is stored  as separate yaml files
- one yaml file for each month
- clean, simple, modern, intuitive, polished UI design and color palette, inspired by neo brutalism style
- 1-year activity graph (start of the current year - end of the year)
- Main use case and functionality:
-- user can open the form
-- form is displaying 1-year activity graph
-- graph data is loaded from yaml file
--  by default, current day/cell  is selected in the graph and visually highlighted (outline)
-- do not create calendar picker component, graph itself will be used to select date
--  by default, "default" graph/board  is selected in the dropdown (multiple graphs will be implemented in the future)
-- user can select in dropdown other activity graphs (e.g. "coding", "swimming", "learning")
-- user can selects any day/cell in current activity graph
-- when day/cell is selected, user can click "add" and enter  new activity as text  string entry  data for selected  date
-- user can see added activities when day/cell is selected
-- user can see rendered activity graph on the form
-- by default each activity/day/cell entry has  "description" field (plain text, 128 chars max)
-- each activity  can have  multiple text fields as entries
-- user can update name of the activity graph
-- user can vew entry data by hovering mouse over day/cell in activity graph

- implement basic error handling and validation
- all interactive elements should have tooltips
- add subtle animations as needed to enhance usability
