-- Enable Supabase Realtime on critical tables for live sync
-- This allows multiple users to see changes in real-time

-- Documents: live sync when someone uploads/deletes a document
ALTER PUBLICATION supabase_realtime ADD TABLE documents;

-- News: live sync for new articles
ALTER PUBLICATION supabase_realtime ADD TABLE news;

-- Feed posts: live sync for social feed
ALTER PUBLICATION supabase_realtime ADD TABLE feed_posts;

-- Danger reports / Signalements: live sync for QSE
ALTER PUBLICATION supabase_realtime ADD TABLE danger_reports;

-- Activity logs: live sync in admin dashboard
ALTER PUBLICATION supabase_realtime ADD TABLE activity_logs;
