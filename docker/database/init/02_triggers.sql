CREATE OR REPLACE FUNCTION limit_users_to_4()
RETURNS TRIGGER AS $$
BEGIN
    IF (SELECT COUNT(*) FROM users) >= 4 THEN
        RAISE EXCEPTION 'Numero massimo di utenti (4) raggiunto';
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_limit_users
BEFORE INSERT ON users
FOR EACH ROW
EXECUTE FUNCTION limit_users_to_4();
