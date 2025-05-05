import fsp from "fs/promises";

export async function fileExists (filepath)
{
    try
    {
        await fsp.access(filepath);
        return true;
    } catch
    {
        return false;
    }
}
