-- Force PostgREST to reload schema metadata after migration changes.
NOTIFY pgrst, 'reload schema';
