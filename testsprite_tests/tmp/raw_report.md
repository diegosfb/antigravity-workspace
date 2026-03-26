
# TestSprite AI Testing Report(MCP)

---

## 1️⃣ Document Metadata
- **Project Name:** BetterTris-v2
- **Date:** 2026-03-26
- **Prepared by:** TestSprite AI Team

---

## 2️⃣ Requirement Validation Summary

#### Test TC001 Create room and display generated Room ID
- **Test Code:** [TC001_Create_room_and_display_generated_Room_ID.py](./TC001_Create_room_and_display_generated_Room_ID.py)
- **Test Visualization and Result:** https://www.testsprite.com/dashboard/mcp/tests/23af6567-cbe2-459f-851b-8414e8245303/55160612-d190-4ba4-88e5-0c40d24ed1fa
- **Status:** ✅ Passed
- **Analysis / Findings:** {{TODO:AI_ANALYSIS}}.
---

#### Test TC002 Join an existing room and see lobby player list
- **Test Code:** [TC002_Join_an_existing_room_and_see_lobby_player_list.py](./TC002_Join_an_existing_room_and_see_lobby_player_list.py)
- **Test Visualization and Result:** https://www.testsprite.com/dashboard/mcp/tests/23af6567-cbe2-459f-851b-8414e8245303/5643b1b5-8e5b-4ac0-93ab-22d8cac959c1
- **Status:** ✅ Passed
- **Analysis / Findings:** {{TODO:AI_ANALYSIS}}.
---

#### Test TC003 Join room then start game to reach game screen
- **Test Code:** [TC003_Join_room_then_start_game_to_reach_game_screen.py](./TC003_Join_room_then_start_game_to_reach_game_screen.py)
- **Test Error:** Starting the game from the lobby could not be completed because there are not enough players in the room. The owner controls exist, but the match cannot be started while only one player is present.

Observations:
- A room was created with owner name 'OwnerTest' and room code 'TK05XW'.
- The UI shows: "Waiting for Players" and the message "Need at least 2 players to start".
- The owner is listed (OwnerTest (You)) and there are no opponents/other players.
- No enabled START/BEGIN control was available to initiate the match (start is gated until another player joins).

Because the lobby requires a second player to enable starting the match, the requested verification (start game transitions to the game screen) could not be completed in this session.
- **Test Visualization and Result:** https://www.testsprite.com/dashboard/mcp/tests/23af6567-cbe2-459f-851b-8414e8245303/5d6f34f3-9e61-4719-9df4-832a60e3b1a4
- **Status:** ❌ Failed
- **Analysis / Findings:** {{TODO:AI_ANALYSIS}}.
---

#### Test TC004 Attempt to join with invalid room ID shows room-not-found error
- **Test Code:** [TC004_Attempt_to_join_with_invalid_room_ID_shows_room_not_found_error.py](./TC004_Attempt_to_join_with_invalid_room_ID_shows_room_not_found_error.py)
- **Test Error:** Submitting a non-existent room code did not produce an error; the lobby accepted the code and entered a waiting state instead.

Observations:
- After entering 'INVALID_ROOM_ID' and clicking JOIN, no error message like 'room not found' was visible.
- The UI displays 'Room Code INVALID_ROOM_ID' indicating the code was accepted.
- The central panel shows 'Waiting for Players' and 'Need at least 2 players to start'.
- The join dialog is no longer visible and no failure message appeared on the page.
- The room-not-found verification was attempted once and did not trigger the expected error handling.
- **Test Visualization and Result:** https://www.testsprite.com/dashboard/mcp/tests/23af6567-cbe2-459f-851b-8414e8245303/39b62ae5-33ca-469c-9c30-384166e737cd
- **Status:** ❌ Failed
- **Analysis / Findings:** {{TODO:AI_ANALYSIS}}.
---

#### Test TC005 Attempt to join a full room shows room-full error
- **Test Code:** [TC005_Attempt_to_join_a_full_room_shows_room_full_error.py](./TC005_Attempt_to_join_a_full_room_shows_room_full_error.py)
- **Test Error:** Joining a room could not be attempted because the Room ID field is not accessible as an interactive element on the page.

Observations:
- The UI visually shows a Room ID box with the placeholder text "ENTER ROOM CODE...".
- The browser interactive elements list contains a name input (Enter name...) and a single button element, but no distinct interactive input for the Room ID.
- The JOIN and BACK actions appear within the same button element index in the interactive list, preventing separate interaction.
- Server status is shown as CONNECTED in the lobby UI.
- The Room ID control appears to be inside a custom/shadow component and is not exposed for automated interaction.
- **Test Visualization and Result:** https://www.testsprite.com/dashboard/mcp/tests/23af6567-cbe2-459f-851b-8414e8245303/6b7f47ef-7083-43d0-9b69-0682098aa9b5
- **Status:** ❌ Failed
- **Analysis / Findings:** {{TODO:AI_ANALYSIS}}.
---

#### Test TC006 Empty room ID input prevents joining via UI validation
- **Test Code:** [TC006_Empty_room_ID_input_prevents_joining_via_UI_validation.py](./TC006_Empty_room_ID_input_prevents_joining_via_UI_validation.py)
- **Test Visualization and Result:** https://www.testsprite.com/dashboard/mcp/tests/23af6567-cbe2-459f-851b-8414e8245303/6535734a-9a82-4d00-a810-3e7dfb539032
- **Status:** ✅ Passed
- **Analysis / Findings:** {{TODO:AI_ANALYSIS}}.
---

#### Test TC007 Keyboard controls move/rotate and hard drop during gameplay
- **Test Code:** [TC007_Keyboard_controls_moverotate_and_hard_drop_during_gameplay.py](./TC007_Keyboard_controls_moverotate_and_hard_drop_during_gameplay.py)
- **Test Error:** The keyboard controls could not be tested because the game could not be started. The room requires at least two players to begin the match, so there is no active piece to interact with.

Observations:
- The room was created and 'player1' appears in the Players list.
- The central area shows 'Waiting for Players' and the message 'Need at least 2 players to start'.
- The Opponents panel shows 'No opponents yet'.
- There is no active match or accessible Start Game control to begin gameplay for keyboard testing.
- Keyboard actions (ArrowLeft, ArrowUp, Space) were not performed because the match never began.

- **Test Visualization and Result:** https://www.testsprite.com/dashboard/mcp/tests/23af6567-cbe2-459f-851b-8414e8245303/212625bf-850d-4970-b748-eb8fa066acf6
- **Status:** ❌ Failed
- **Analysis / Findings:** {{TODO:AI_ANALYSIS}}.
---

#### Test TC008 Clearing lines updates score and removes lines
- **Test Code:** [TC008_Clearing_lines_updates_score_and_removes_lines.py](./TC008_Clearing_lines_updates_score_and_removes_lines.py)
- **Test Error:** Could not start or play the game because a second player is required to begin a multiplayer match.

Observations:
- The lobby displays 'Waiting for Players' and 'Need at least 2 players to start'.
- Only one player is listed (player1) in the players panel.
- A READY UP control is visible but no Start Game control is available while only one player is present.
- The game board area is visible but inactive; no gameplay can begin until a second player joins.

Because the multiplayer match cannot be started with a single player, the steps to clear lines and verify score updates could not be executed.
- **Test Visualization and Result:** https://www.testsprite.com/dashboard/mcp/tests/23af6567-cbe2-459f-851b-8414e8245303/3b23966c-6b4b-4e1c-a24d-65b37d402ffd
- **Status:** ❌ Failed
- **Analysis / Findings:** {{TODO:AI_ANALYSIS}}.
---

#### Test TC009 Clearing 2 lines shows special piece available indicator
- **Test Code:** [TC009_Clearing_2_lines_shows_special_piece_available_indicator.py](./TC009_Clearing_2_lines_shows_special_piece_available_indicator.py)
- **Test Error:** Could not start the game because a minimum of two players is required, so the in-game test to clear exactly two lines and verify the special-piece notification could not be executed.

Observations:
- The room was created and shows room code 'D2F7XC'.
- The lobby displays ‘Waiting for Players’ and the message: 'Need at least 2 players to start'.
- Only one player is present in the Players list: 'Tester (You)'.
- No Start/Start Game control is visible or available to begin the match.
- The game board is not accessible, so clearing lines and checking for the special-piece notification cannot be performed.

- **Test Visualization and Result:** https://www.testsprite.com/dashboard/mcp/tests/23af6567-cbe2-459f-851b-8414e8245303/b1099962-e796-4a76-af9a-9a6ca7dd3d2c
- **Status:** ❌ Failed
- **Analysis / Findings:** {{TODO:AI_ANALYSIS}}.
---

#### Test TC010 Keyboard focus loss prevents piece movement until refocus
- **Test Code:** [TC010_Keyboard_focus_loss_prevents_piece_movement_until_refocus.py](./TC010_Keyboard_focus_loss_prevents_piece_movement_until_refocus.py)
- **Test Error:** The test could not be completed because the game could not be started — the room requires at least two players.

Observations:
- The lobby displays the message: 'Need at least 2 players to start'.
- Only one player is listed: 'Tester (You)'.
- No START GAME control is available/enabled to begin gameplay.
- Room code 'Y4CBJA' is visible and the UI is waiting for players.
- The central game area is inactive with a waiting message, so in-game keyboard controls cannot be exercised.
- **Test Visualization and Result:** https://www.testsprite.com/dashboard/mcp/tests/23af6567-cbe2-459f-851b-8414e8245303/ebec8f70-144d-4bbb-b58a-28d2a6d4ebd1
- **Status:** ❌ Failed
- **Analysis / Findings:** {{TODO:AI_ANALYSIS}}.
---

#### Test TC011 Game over displays game over screen with final result
- **Test Code:** [TC011_Game_over_displays_game_over_screen_with_final_result.py](./TC011_Game_over_displays_game_over_screen_with_final_result.py)
- **Test Error:** Could not reach the game-over screen because the match cannot be started with only one player.

Observations:
- The lobby for room code '2W0AZ0' is open and shows 'Tester (You)' as the only player.
- The page displays the message: 'Need at least 2 players to start'.
- There are no opponents shown ('No opponents yet').
- A large 'READY UP' button is present but no option to start the match alone is available.
- Without a second player joining, the match cannot begin and the game-over state cannot be reached.
- **Test Visualization and Result:** https://www.testsprite.com/dashboard/mcp/tests/23af6567-cbe2-459f-851b-8414e8245303/cd0e0d83-a728-409c-ab44-a646eee18ca6
- **Status:** ❌ Failed
- **Analysis / Findings:** {{TODO:AI_ANALYSIS}}.
---

#### Test TC012 Earn special piece then send to an opponent successfully
- **Test Code:** [TC012_Earn_special_piece_then_send_to_an_opponent_successfully.py](./TC012_Earn_special_piece_then_send_to_an_opponent_successfully.py)
- **Test Error:** Verification could not be completed because there are no opponents in the room to send a special piece to.

Observations:
- A room was successfully created and shows Room Code: OV91MT
- The Players panel shows only 'TestPlayer (You)'
- The center message reads 'Waiting for Players' and 'Need at least 2 players to start'
- The Opponents panel displays 'No opponents yet'
- There is no UI element available to select an opponent or send a special piece because no opponents are listed
- **Test Visualization and Result:** https://www.testsprite.com/dashboard/mcp/tests/23af6567-cbe2-459f-851b-8414e8245303/640c40f8-1e6f-44b1-87a7-0c23ad7f3bdf
- **Status:** ❌ Failed
- **Analysis / Findings:** {{TODO:AI_ANALYSIS}}.
---

#### Test TC013 Sending special without selecting opponent shows validation error
- **Test Code:** [TC013_Sending_special_without_selecting_opponent_shows_validation_error.py](./TC013_Sending_special_without_selecting_opponent_shows_validation_error.py)
- **Test Error:** Could not complete the test because the Room ID field in the Join dialog is not interactable, preventing joining a room and reaching the in-game controls.

Observations:
- The Join Match dialog is open and the name field contains 'Tester'.
- The Room ID input is visible in the UI but is not exposed as an interactive element to automation.
- Only a single button element is exposed that appears to contain both BACK and JOIN labels, making it impossible to reliably submit a join.
- No room join was performed and the game could not be started, so the send-special validation could not be reached.
- **Test Visualization and Result:** https://www.testsprite.com/dashboard/mcp/tests/23af6567-cbe2-459f-851b-8414e8245303/b6e1d0d5-9d06-4aa1-9144-b4a48be03143
- **Status:** ❌ Failed
- **Analysis / Findings:** {{TODO:AI_ANALYSIS}}.
---


## 3️⃣ Coverage & Matching Metrics

- **23.08** of tests passed

| Requirement        | Total Tests | ✅ Passed | ❌ Failed  |
|--------------------|-------------|-----------|------------|
| ...                | ...         | ...       | ...        |
---


## 4️⃣ Key Gaps / Risks
{AI_GNERATED_KET_GAPS_AND_RISKS}
---