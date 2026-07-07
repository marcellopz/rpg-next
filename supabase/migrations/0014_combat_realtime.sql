-- Broadcast combat changes so open clients can live-refresh the modal.
alter publication supabase_realtime
  add table combat_sessions, combat_combatants, combat_conditions;
